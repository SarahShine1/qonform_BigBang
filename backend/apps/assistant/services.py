import logging
import re
import unicodedata

from django.apps import apps as django_apps
from django.db import DatabaseError
from django.db.models import Q

from apps.accounts.models import Departement, Utilisateur
from apps.accounts.utils import get_active_role_labels_for_user
from apps.documents.models import Document
from apps.fiches.models import ProcessusLiaison, VersionFiche
from apps.organigramme.models import OrganizationUnit
from apps.processus.models import Processus, ProcessusExterne, ProcessusLiaisonExterne


logger = logging.getLogger(__name__)

FALLBACK_ANSWER = (
    "Je n'ai pas trouve d'information correspondante dans Qonform. "
    "Essayez avec un terme plus precis ou consultez le dictionnaire qualite."
)

DEFAULT_FALLBACK_LINKS = [
    {"label": "Voir l'organigramme", "path": "/organigramme"},
    {"label": "Voir cartographie", "path": "/cartographie/processus"},
    {"label": "Voir documents", "path": "/documents"},
]

FIELD_HELP_MAPPING = {
    "objectif du processus": {
        "article_iso": "6.2",
        "help": "Decrivez la finalite du processus et les resultats attendus.",
        "example": "Assurer le traitement des depenses dans les delais reglementaires.",
        "aliases": ["objectif", "objectifs", "objectif mesurable", "objectifs mesurables"],
        "related_fields": ["kpi", "risques"],
    },
    "entrees": {
        "article_iso": "4.4",
        "help": "Listez les donnees, documents ou declencheurs necessaires au demarrage du processus.",
        "example": "Bon de commande, demande interne, credits disponibles.",
        "aliases": ["entree", "entrees", "donnees d'entree", "elements d'entree"],
        "related_fields": ["sorties", "documents"],
    },
    "sorties": {
        "article_iso": "4.4",
        "help": "Listez les livrables produits par le processus et leurs destinataires.",
        "example": "Mandat de paiement, rapport, fiche validee.",
        "aliases": ["sortie", "sorties", "livrables"],
        "related_fields": ["entrees", "documents"],
    },
    "risques": {
        "article_iso": "6.1",
        "help": "Indiquez les risques pouvant empecher le processus d'atteindre ses objectifs.",
        "example": "Dossier incomplet, retard validation, erreur d'imputation.",
        "aliases": ["risque", "risques"],
        "related_fields": ["opportunites", "objectifs du processus"],
    },
    "kpi": {
        "article_iso": "9.1",
        "help": "Definissez les indicateurs permettant de mesurer la performance du processus.",
        "example": "Taux de rejet, delai moyen de traitement, taux de conformite.",
        "aliases": ["kpi", "indicateur", "indicateurs", "objectifs mesurables"],
        "related_fields": ["objectif du processus"],
    },
    "documents": {
        "article_iso": "7.5",
        "help": "Ajoutez les documents de reference et les enregistrements generes.",
        "example": "Procedure, registre, formulaire, rapport.",
        "aliases": [
            "document",
            "documents",
            "preuve",
            "preuves",
            "enregistrement",
            "enregistrements",
            "informations documentees",
            "reference",
            "references",
        ],
        "related_fields": ["entrees", "sorties"],
    },
    "dysfonctionnements": {
        "article_iso": "10.2",
        "help": "Decrivez les problemes connus, leurs causes, consequences et actions d'amelioration.",
        "example": "Dossier incomplet transmis au service comptable.",
        "aliases": ["dysfonctionnement", "dysfonctionnements", "probleme", "problemes"],
        "related_fields": ["risques"],
    },
    "pilote": {
        "article_iso": "5.3",
        "help": "Indiquez la personne responsable du pilotage du processus.",
        "example": "Chef de service Budget.",
        "aliases": ["pilote", "responsable du processus"],
        "related_fields": ["ressources", "competences"],
    },
    "ressources": {
        "article_iso": "7.1",
        "help": "Indiquez les moyens humains, materiels, logiciels et locaux necessaires.",
        "example": "Agents, Excel, imprimantes, bureau, archivage.",
        "aliases": ["ressource", "ressources", "moyens"],
        "related_fields": ["competences"],
    },
    "competences": {
        "article_iso": "7.2",
        "help": "Indiquez les competences necessaires pour executer le processus.",
        "example": "Maitrise reglementation, comptabilite publique, Excel.",
        "aliases": ["competence", "competences", "qualification", "qualifications"],
        "related_fields": ["ressources", "pilote"],
    },
}

STATIC_DICTIONARY = {
    "kpi": {
        "term": "KPI",
        "category": "Indicateur",
        "definition": "Un KPI est un indicateur cle qui permet de mesurer la performance d'un processus ou d'un objectif.",
        "example": "Delai moyen de traitement, taux de conformite, taux de rejet.",
        "synonyms": ["indicateur", "indicateur cle"],
    },
    "non conformite": {
        "term": "Non-conformite",
        "category": "Qualite",
        "definition": "Une non-conformite est un ecart entre une exigence attendue et la realite observee.",
        "example": "Un dossier traite sans validation obligatoire constitue une non-conformite.",
        "synonyms": ["nc", "ecart"],
    },
    "risque": {
        "term": "Risque",
        "category": "Risque",
        "definition": "Un risque est un evenement potentiel susceptible d'empecher l'atteinte d'un resultat attendu.",
        "example": "Retard de validation, erreur de saisie, absence de piece justificative.",
        "synonyms": ["risques"],
    },
    "processus": {
        "term": "Processus",
        "category": "Processus",
        "definition": "Un processus est un ensemble d'activites liees qui transforment des elements d'entree en resultats.",
        "example": "Le processus d'execution du budget transforme une demande validee en paiement realise.",
        "synonyms": ["process"],
    },
    "audit": {
        "term": "Audit",
        "category": "Audit",
        "definition": "Un audit est un examen methodique et documente destine a verifier la conformite et l'efficacite d'un dispositif.",
        "example": "Audit interne d'un processus support avant certification.",
        "synonyms": ["evaluation", "controle"],
    },
}

STATIC_ROUTE_HELP = [
    {
        "key": "organigramme",
        "keywords": ["organigramme", "responsable", "departement", "service", "direction"],
        "path": "/organigramme",
        "label": "Voir l'organigramme",
        "description": "ouvrez l'organigramme pour consulter la structure et les responsables.",
    },
    {
        "key": "processus",
        "keywords": ["processus", "cartographie", "pilotage"],
        "path": "/cartographie/processus",
        "label": "Voir cartographie",
        "description": "ouvrez la cartographie des processus pour parcourir les fiches et les pilotes.",
    },
    {
        "key": "interactions",
        "keywords": ["interaction", "interactions", "amont", "aval"],
        "path": "/cartographie/interactions",
        "label": "Voir les interactions",
        "description": "ouvrez la cartographie des interactions pour voir les liens amont et aval.",
    },
    {
        "key": "documents",
        "keywords": ["document", "documents", "preuve", "enregistrement"],
        "path": "/documents",
        "label": "Voir documents",
        "description": "ouvrez l'espace documents pour retrouver les references et supports disponibles.",
    },
    {
        "key": "audits terrain",
        "keywords": ["audit terrain", "audits terrain"],
        "path": "/audit/audits-terrain",
        "label": "Voir les audits terrain",
        "description": "ouvrez la page des audits terrain pour preparer ou consulter les campagnes.",
    },
    {
        "key": "parametres",
        "keywords": ["parametre", "parametres", "reglage", "reglages"],
        "path": "/parametres",
        "label": "Voir les parametres",
        "description": "ouvrez les parametres pour gerer votre profil et vos preferences.",
    },
]

STOP_WORDS = {
    "qui",
    "est",
    "le",
    "la",
    "les",
    "de",
    "du",
    "des",
    "un",
    "une",
    "dans",
    "pour",
    "avec",
    "sur",
    "quel",
    "quelle",
    "quels",
    "quelles",
    "dois",
    "mettre",
    "comment",
    "remplir",
    "champ",
    "fiche",
    "article",
    "iso",
    "correspond",
    "correspondent",
    "c",
    "ce",
    "cest",
    "quoi",
    "responsable",
    "departement",
    "service",
    "direction",
    "processus",
    "process",
}


def _normalize_text(value):
    cleaned = " ".join(str(value or "").strip().split())
    ascii_value = unicodedata.normalize("NFKD", cleaned).encode("ascii", "ignore").decode("ascii")
    return ascii_value.lower()


def _tokenize(value):
    return [
        token
        for token in re.split(r"[^a-z0-9]+", _normalize_text(value))
        if token and token not in STOP_WORDS
    ]


def _safe_db_call(func, default):
    try:
        return func()
    except DatabaseError as exc:
        logger.debug("Assistant data lookup failed: %s", exc)
        return default
    except Exception as exc:
        logger.debug("Assistant lookup skipped: %s", exc)
        return default


def _build_response(answer, intent, sources=None, quick_links=None):
    return {
        "answer": answer,
        "intent": intent,
        "sources": _dedupe_sources(sources or []),
        "quick_links": _dedupe_links(quick_links or []),
    }


def _dedupe_sources(sources):
    seen = set()
    unique_sources = []
    for source in sources:
        key = (source.get("type"), source.get("id"), source.get("label"))
        if key in seen:
            continue
        seen.add(key)
        unique_sources.append(source)
    return unique_sources


def _dedupe_links(links):
    seen = set()
    unique_links = []
    for link in links:
        path = link.get("path")
        if not path:
            continue
        key = (link.get("label"), path)
        if key in seen:
            continue
        seen.add(key)
        unique_links.append(link)
    return unique_links


def _fallback_response():
    return _build_response(FALLBACK_ANSWER, "fallback", quick_links=DEFAULT_FALLBACK_LINKS)


def _contains_any(text, keywords):
    return any(keyword in text for keyword in keywords)


def _match_named_record(question, records, name_keys):
    normalized_question = _normalize_text(question)
    tokens = set(_tokenize(question))
    best = None
    best_score = 0

    for record in records:
        values = [str(record.get(key, "") or "") for key in name_keys]
        normalized_values = [_normalize_text(value) for value in values if value]
        combined_tokens = set()
        for value in values:
            combined_tokens.update(_tokenize(value))

        score = 0
        for value in normalized_values:
            if not value:
                continue
            if value in normalized_question:
                score = max(score, 100 + len(value))
            elif normalized_question in value:
                score = max(score, 60 + len(normalized_question))

        overlap = len(tokens.intersection(combined_tokens))
        if overlap:
            score = max(score, 20 + overlap)

        if score > best_score:
            best = record
            best_score = score

    return best if best_score > 0 else None


def _get_profile_for_user(user):
    if not user or not getattr(user, "is_authenticated", False):
        return None

    return _safe_db_call(
        lambda: Utilisateur.objects.filter(auth=user).first()
        or Utilisateur.objects.filter(email__iexact=user.email).first(),
        None,
    )


def _get_roles_for_user(user):
    profile = _get_profile_for_user(user)
    if not profile:
        return []
    return _safe_db_call(lambda: get_active_role_labels_for_user(profile.id_user), []) or []


def _user_has_role(user, *roles):
    requested = {_normalize_text(role) for role in roles}
    return bool({_normalize_text(role) for role in _get_roles_for_user(user)}.intersection(requested))


def _find_field_key(question, context=None):
    candidates = [question, (context or {}).get("current_field_name", "")]
    for candidate in candidates:
        normalized_candidate = _normalize_text(candidate)
        for field_key, field_meta in FIELD_HELP_MAPPING.items():
            aliases = {_normalize_text(field_key), *[_normalize_text(alias) for alias in field_meta.get("aliases", [])]}
            if any(alias and alias in normalized_candidate for alias in aliases):
                return field_key
    return None


def _extract_lookup_terms(question):
    return [token for token in _tokenize(question) if len(token) >= 3][:6]


def _search_dictionary(question):
    normalized_question = _normalize_text(question)
    lookup_terms = _extract_lookup_terms(question)

    if django_apps.is_installed("apps.dictionary"):
        dictionary_model = _safe_db_call(
            lambda: django_apps.get_model("dictionary", "DictionaryTerm"),
            None,
        )
        if dictionary_model:
            entries = _safe_db_call(
                lambda: list(
                    dictionary_model.objects.filter(is_active=True).values(
                        "id",
                        "term",
                        "normalized_term",
                        "category",
                        "definition",
                        "example",
                        "synonyms",
                    )
                ),
                [],
            )
            match = _match_dictionary_entry(normalized_question, lookup_terms, entries)
            if match:
                return {
                    "answer": _format_dictionary_answer(match["term"], match["definition"], match.get("category"), match.get("example")),
                    "intent": "dictionary_term",
                    "sources": [
                        {
                            "type": "dictionary",
                            "label": f"Dictionnaire qualite - {match['term']}",
                            "id": match.get("id"),
                        }
                    ],
                    "quick_links": [],
                }

    static_entries = []
    for idx, entry in enumerate(STATIC_DICTIONARY.values(), start=1):
        static_entries.append(
            {
                "id": f"static-{idx}",
                "term": entry["term"],
                "normalized_term": _normalize_text(entry["term"]),
                "category": entry.get("category"),
                "definition": entry["definition"],
                "example": entry.get("example", ""),
                "synonyms": entry.get("synonyms", []),
            }
        )
    match = _match_dictionary_entry(normalized_question, lookup_terms, static_entries)
    if match:
        return {
            "answer": _format_dictionary_answer(match["term"], match["definition"], match.get("category"), match.get("example")),
            "intent": "dictionary_term",
            "sources": [
                {
                    "type": "dictionary",
                    "label": f"Reference qualite - {match['term']}",
                    "id": match.get("id"),
                }
            ],
            "quick_links": [],
        }
    return None


def _match_dictionary_entry(normalized_question, lookup_terms, entries):
    best = None
    best_score = 0
    for entry in entries:
        term = _normalize_text(entry.get("term"))
        synonyms = [_normalize_text(item) for item in entry.get("synonyms") or []]
        candidates = [term, entry.get("normalized_term", ""), *synonyms]
        score = 0
        for candidate in candidates:
            if not candidate:
                continue
            if candidate == normalized_question:
                score = max(score, 150)
            elif candidate in normalized_question:
                score = max(score, 120 + len(candidate))
            elif normalized_question in candidate:
                score = max(score, 90 + len(normalized_question))
            elif candidate in lookup_terms:
                score = max(score, 85)

        if lookup_terms:
            candidate_tokens = set(_tokenize(f"{entry.get('term', '')} {' '.join(entry.get('synonyms') or [])}"))
            overlap = len(set(lookup_terms).intersection(candidate_tokens))
            if overlap:
                score = max(score, 30 + overlap)

        if score > best_score:
            best = entry
            best_score = score

    return best if best_score > 0 else None


def _format_dictionary_answer(term, definition, category=None, example=None):
    parts = [f"{term} : {definition}"]
    if category:
        parts.append(f"Categorie : {category}.")
    if example:
        parts.append(f"Exemple : {example}")
    return " ".join(parts)


def _answer_department_responsible(user, question):
    departments = _safe_db_call(
        lambda: list(
            Departement.objects.all().values("id_departement", "nom", "code")
        ),
        [],
    )
    units = _safe_db_call(
        lambda: list(
            OrganizationUnit.objects.filter(is_active=True).values(
                "id", "name", "code", "type", "responsable_id"
            )
        ),
        [],
    )

    department = _match_named_record(question, departments, ("nom", "code"))
    unit = _match_named_record(question, units, ("name", "code"))

    if not department and unit:
        department = next(
            (
                item
                for item in departments
                if _normalize_text(item["nom"]) == _normalize_text(unit["name"])
            ),
            None,
        )

    selected_name = None
    selected_department_id = None
    responsable_id = None

    if department:
        selected_name = department["nom"]
        selected_department_id = department["id_departement"]
        if not unit:
            unit = next(
                (
                    item
                    for item in units
                    if _normalize_text(item["name"]) == _normalize_text(department["nom"])
                    or _normalize_text(item["code"]) == _normalize_text(department.get("code"))
                ),
                None,
            )
    if unit:
        selected_name = selected_name or unit["name"]
        responsable_id = unit.get("responsable_id")

    if not selected_name:
        return _build_response(
            "Je n'ai pas trouve le departement ou le service demande dans Qonform.",
            "department_responsible",
            quick_links=[{"label": "Voir l'organigramme", "path": "/organigramme"}],
        )

    responsible_profile = None
    if responsable_id:
        responsible_profile = _safe_db_call(
            lambda: Utilisateur.objects.filter(id_user=responsable_id, est_actif=True).first(),
            None,
        )

    if not responsible_profile and selected_department_id:
        candidates = _safe_db_call(
            lambda: list(
                Utilisateur.objects.filter(
                    id_departement=selected_department_id,
                    est_actif=True,
                ).order_by("nom", "prenom")
            ),
            [],
        )
        responsible_profile = _pick_responsible_candidate(candidates)

    if not responsible_profile:
        return _build_response(
            f"Je n'ai pas trouve de responsable renseigne pour {selected_name}.",
            "department_responsible",
            sources=[{"type": "department", "label": selected_name, "id": selected_department_id}],
            quick_links=[{"label": "Voir l'organigramme", "path": "/organigramme"}],
        )

    roles = _safe_db_call(lambda: get_active_role_labels_for_user(responsible_profile.id_user), []) or []
    role_label = roles[0] if roles else "Responsable"
    department_label = selected_name
    answer = (
        f"Le responsable de {department_label} est {responsible_profile.prenom} {responsible_profile.nom}. "
        f"Fonction : {role_label}. "
        f"Email professionnel : {responsible_profile.email}."
    )
    return _build_response(
        answer,
        "department_responsible",
        sources=[
            {"type": "department", "label": department_label, "id": selected_department_id},
            {
                "type": "user",
                "label": f"{responsible_profile.prenom} {responsible_profile.nom}",
                "id": responsible_profile.id_user,
            },
        ],
        quick_links=[{"label": "Voir l'organigramme", "path": "/organigramme"}],
    )


def _pick_responsible_candidate(candidates):
    best = None
    best_score = 0
    for candidate in candidates:
        roles = _safe_db_call(lambda: get_active_role_labels_for_user(candidate.id_user), []) or []
        normalized_roles = " ".join(_normalize_text(role) for role in roles)
        score = 0
        if any(keyword in normalized_roles for keyword in ("chef", "directeur", "responsable", "pilote")):
            score += 10
        if len(roles) == 1:
            score += 1
        if score > best_score:
            best = candidate
            best_score = score

    if best:
        return best
    return candidates[0] if len(candidates) == 1 else None


def _answer_process_lookup(question, context=None):
    processes = _safe_db_call(
        lambda: list(
            Processus.objects.all().values(
                "id_processus",
                "code_process",
                "nom",
                "description",
                "type_process",
                "id_departement",
                "id_pilote",
            )
        ),
        [],
    )
    if not processes:
        return _build_response(
            "Je n'ai pas trouve de processus correspondant dans Qonform.",
            "process_lookup",
            quick_links=[
                {"label": "Voir cartographie", "path": "/cartographie/processus"},
                {"label": "Voir les interactions", "path": "/cartographie/interactions"},
            ],
        )

    process = _match_named_record(question, processes, ("nom", "code_process"))
    if not process and (context or {}).get("selected_process_id"):
        process = next(
            (
                item
                for item in processes
                if item["id_processus"] == context["selected_process_id"]
            ),
            None,
        )

    if not process:
        return _build_response(
            "Je n'ai pas trouve le processus demande dans Qonform.",
            "process_lookup",
            quick_links=[{"label": "Voir cartographie", "path": "/cartographie/processus"}],
        )

    asks_upstream = _contains_any(_normalize_text(question), [" amont", "en amont", "precede", "precedent"])
    asks_downstream = _contains_any(_normalize_text(question), [" aval", "en aval", "suivant", "suivants"])

    process_map = {item["id_processus"]: item for item in processes}
    liaisons = _safe_db_call(
        lambda: list(
            ProcessusLiaison.objects.filter(
                Q(id_processus_amont=process["id_processus"]) | Q(id_processus_aval=process["id_processus"])
            ).values("id_processus_amont", "id_processus_aval")
        ),
        [],
    )
    external_liaisons = _safe_db_call(
        lambda: list(
            ProcessusLiaisonExterne.objects.filter(id_processus=process["id_processus"]).values(
                "id_processus_externe",
                "sens",
            )
        ),
        [],
    )
    external_processes = _safe_db_call(
        lambda: {
            item["id_processus_externe"]: item["nom"]
            for item in ProcessusExterne.objects.all().values("id_processus_externe", "nom")
        },
        {},
    )

    upstream = []
    downstream = []
    for liaison in liaisons:
        if liaison["id_processus_aval"] == process["id_processus"]:
            related = process_map.get(liaison["id_processus_amont"])
            if related:
                upstream.append(related["nom"])
        if liaison["id_processus_amont"] == process["id_processus"]:
            related = process_map.get(liaison["id_processus_aval"])
            if related:
                downstream.append(related["nom"])

    for liaison in external_liaisons:
        external_name = external_processes.get(liaison["id_processus_externe"])
        if not external_name:
            continue
        if liaison["sens"] == "amont":
            upstream.append(f"{external_name} (externe)")
        elif liaison["sens"] == "aval":
            downstream.append(f"{external_name} (externe)")

    pilote = None
    if process.get("id_pilote"):
        pilote = _safe_db_call(
            lambda: Utilisateur.objects.filter(id_user=process["id_pilote"]).values("prenom", "nom").first(),
            None,
        )

    base_answer = [
        f"Processus : {process['nom']} ({process['code_process']}).",
        f"Type : {process['type_process']}.",
    ]
    if pilote:
        base_answer.append(f"Pilote : {pilote['prenom']} {pilote['nom']}.")
    if process.get("description"):
        base_answer.append(f"Description : {process['description']}")

    if asks_upstream:
        if upstream:
            base_answer.append(f"Processus en amont : {', '.join(sorted(set(upstream)))}.")
        else:
            base_answer.append("Aucun processus en amont n'est renseigne.")
    elif asks_downstream:
        if downstream:
            base_answer.append(f"Processus en aval : {', '.join(sorted(set(downstream)))}.")
        else:
            base_answer.append("Aucun processus en aval n'est renseigne.")
    else:
        if upstream:
            base_answer.append(f"Amont : {', '.join(sorted(set(upstream)))}.")
        if downstream:
            base_answer.append(f"Aval : {', '.join(sorted(set(downstream)))}.")

    return _build_response(
        " ".join(base_answer),
        "process_lookup",
        sources=[
            {"type": "process", "label": process["nom"], "id": process["id_processus"]},
        ],
        quick_links=[
            {"label": "Voir cartographie", "path": "/cartographie/processus"},
            {"label": "Voir les interactions", "path": "/cartographie/interactions"},
        ],
    )


def _answer_field_help(question, context=None):
    field_key = _find_field_key(question, context=context)
    if not field_key:
        return _build_response(
            "Je peux vous aider si vous precisez le champ de fiche a expliquer.",
            "fiche_field_help",
        )

    field_meta = FIELD_HELP_MAPPING[field_key]
    answer = (
        f"Pour le champ {field_key}, {field_meta['help']} "
        f"Exemple : {field_meta['example']} "
        f"Article ISO associe : {field_meta['article_iso']}."
    )
    quick_links = []
    if field_key == "documents":
        quick_links.append({"label": "Voir documents", "path": "/documents"})
    if field_key == "pilote":
        quick_links.append({"label": "Voir l'organigramme", "path": "/organigramme"})

    return _build_response(
        answer,
        "fiche_field_help",
        sources=[
            {"type": "field_help", "label": f"Guide fiche - {field_key}", "id": field_key},
            {"type": "iso_clause", "label": f"ISO 9001 - article {field_meta['article_iso']}", "id": field_meta["article_iso"]},
        ],
        quick_links=quick_links,
    )


def _answer_iso_clause(question, context=None):
    field_key = _find_field_key(question, context=context)
    if not field_key:
        return _build_response(
            "Je peux faire la correspondance ISO si vous precisez le champ de fiche concerne.",
            "iso_clause_mapping",
        )

    field_meta = FIELD_HELP_MAPPING[field_key]
    related_fields = ", ".join(field_meta.get("related_fields", []))
    answer = (
        f"Le champ {field_key} correspond a l'article ISO 9001:2015 {field_meta['article_iso']}. "
        f"Pourquoi : {field_meta['help']}"
    )
    if related_fields:
        answer += f" Champs lies : {related_fields}."

    return _build_response(
        answer,
        "iso_clause_mapping",
        sources=[
            {"type": "iso_clause", "label": f"ISO 9001 - article {field_meta['article_iso']}", "id": field_meta["article_iso"]},
            {"type": "field_help", "label": f"Champ fiche - {field_key}", "id": field_key},
        ],
    )


def _visible_documents_for_user(user):
    documents = _safe_db_call(
        lambda: list(
            Document.objects.all().values(
                "id_document",
                "nom_fichier",
                "type_document",
                "description",
                "type_support",
                "id_version",
            )[:100]
        ),
        [],
    )
    if not _user_has_role(user, "Auditeur Externe"):
        return documents

    version_ids = [item["id_version"] for item in documents if item.get("id_version")]
    published_ids = set(
        _safe_db_call(
            lambda: VersionFiche.objects.filter(
                id_version__in=version_ids,
                statut="Publiee",
            ).values_list("id_version", flat=True),
            [],
        )
    )
    return [
        item
        for item in documents
        if item["type_document"] == "Support"
        or not item.get("id_version")
        or item["id_version"] in published_ids
    ]


def _answer_document_lookup(user, question):
    documents = _visible_documents_for_user(user)
    if not documents:
        return _build_response(
            "Je n'ai pas trouve de documents consultables correspondant a votre recherche.",
            "document_lookup",
            quick_links=[{"label": "Voir documents", "path": "/documents"}],
        )

    match = _match_named_record(question, documents, ("nom_fichier", "description", "type_support", "type_document"))
    if not match:
        return _build_response(
            "Je n'ai pas trouve de document correspondant dans l'espace documentaire.",
            "document_lookup",
            quick_links=[{"label": "Voir documents", "path": "/documents"}],
        )

    answer_parts = [f"Document trouve : {match['nom_fichier']}."]
    if match.get("type_document"):
        answer_parts.append(f"Type : {match['type_document']}.")
    if match.get("type_support"):
        answer_parts.append(f"Support : {match['type_support']}.")
    if match.get("description"):
        answer_parts.append(f"Description : {match['description']}")

    return _build_response(
        " ".join(answer_parts),
        "document_lookup",
        sources=[
            {"type": "document", "label": match["nom_fichier"], "id": match["id_document"]},
        ],
        quick_links=[{"label": "Voir documents", "path": "/documents"}],
    )


def _answer_navigation(question):
    normalized_question = _normalize_text(question)
    for route in STATIC_ROUTE_HELP:
        if any(_normalize_text(keyword) in normalized_question for keyword in route["keywords"]):
            return _build_response(
                f"Pour {route['key']}, {route['description']}",
                "navigation_help",
                quick_links=[{"label": route["label"], "path": route["path"]}],
            )

    if "dictionnaire" in normalized_question:
        return _build_response(
            "Le dictionnaire qualite est accessible depuis l'icone dictionnaire dans le Topbar.",
            "navigation_help",
        )

    return _fallback_response()


def _detect_intent(question, context=None):
    normalized_question = _normalize_text(question)
    current_path = _normalize_text((context or {}).get("current_path", ""))

    if _contains_any(normalized_question, ["ou trouver", "comment acceder", "ou est", "page", "acceder"]):
        return "navigation_help"
    if _contains_any(normalized_question, ["article iso", "clause", "iso 9001", "quel article iso", "quelle clause"]):
        return "iso_clause_mapping"
    if _contains_any(
        normalized_question,
        ["c est quoi", "c'est quoi", "cest quoi", "definition", "definition de", "signifie", "terme"],
    ):
        return "dictionary_term"
    if _contains_any(normalized_question, ["comment remplir", "dois je mettre", "aide pour remplir", "champ"]) or (
        "/gestion-processus/fiches" in current_path and _find_field_key(question, context=context)
    ):
        return "fiche_field_help"
    if _contains_any(normalized_question, ["responsable", "chef"]) and _contains_any(
        normalized_question, ["departement", "service", "direction", "organigramme", "finances", "budget"]
    ):
        return "department_responsible"
    if _contains_any(normalized_question, ["processus", "process", "amont", "aval", "interaction"]):
        return "process_lookup"
    if _contains_any(normalized_question, ["document", "preuve", "enregistrement", "reference", "informations documentees"]):
        return "document_lookup"
    if _find_field_key(question, context=context):
        return "fiche_field_help"
    if _search_dictionary(question):
        return "dictionary_term"
    return "fallback"


def answer_assistant_question(user, question, context=None):
    normalized_question = " ".join(str(question or "").strip().split())
    context = context or {}

    if not normalized_question:
        return _fallback_response()

    intent = _detect_intent(normalized_question, context=context)

    if intent == "dictionary_term":
        dictionary_answer = _search_dictionary(normalized_question)
        return dictionary_answer or _fallback_response()
    if intent == "department_responsible":
        return _answer_department_responsible(user, normalized_question)
    if intent == "process_lookup":
        return _answer_process_lookup(normalized_question, context=context)
    if intent == "fiche_field_help":
        return _answer_field_help(normalized_question, context=context)
    if intent == "iso_clause_mapping":
        return _answer_iso_clause(normalized_question, context=context)
    if intent == "document_lookup":
        return _answer_document_lookup(user, normalized_question)
    if intent == "navigation_help":
        return _answer_navigation(normalized_question)
    return _fallback_response()
