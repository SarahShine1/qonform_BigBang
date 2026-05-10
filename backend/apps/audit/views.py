from collections import defaultdict

from django.db import connection, transaction
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


RESULT_TO_DB = {
    "conforme": "Conforme",
    "non_conforme": "Non_conforme",
    "partiel": "Partiel",
    "non_applicable": "NA",
}

DB_TO_UI_RESULT = {
    "Conforme": "conforme",
    "Non_conforme": "non_conforme",
    "Partiel": "partiel",
    "NA": "non_applicable",
}

VERSION_STATUS_BUCKETS = {
    "Soumise": "soumise",
    "En_revision": "en_revision",
    "Publiee": "publiee_audit",
}

VERSION_STATUS_LABELS = {
    "Soumise": "Soumise",
    "En_revision": "En révision",
    "Publiee": "Publiée",
}

ACTION_STATUS_TO_DB = {
    "A faire": "Planifiee",
    "En cours": "En_cours",
    "Termine": "Realisee",
}

ACTION_STATUS_FROM_DB = {
    "Planifiee": "A faire",
    "En_cours": "En cours",
    "Realisee": "Termine",
    "Verifiee": "Verifiee",
}

SEVERITY_VALUES = {"Mineure", "Majeure", "Critique"}


def dictfetchall(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def dictfetchone(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))


def get_auditeur_id(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_user
            FROM utilisateur
            WHERE auth_id = %s OR email = %s
            LIMIT 1
            """,
            [request.user.id, getattr(request.user, "email", "")],
        )
        row = cursor.fetchone()
    return row[0] if row else None


def get_status_bucket(version_status):
    return VERSION_STATUS_BUCKETS.get(version_status, "soumise")


def serialize_fiche_card(row):
    version_status = row["statut_fiche"]
    status_key = get_status_bucket(version_status)

    return {
        "id_version": row["id_version"],
        "numero_version": row["numero_version"],
        "statut_fiche": version_status,
        "statut_audit": VERSION_STATUS_LABELS.get(version_status, version_status),
        "rapport_pdf": row.get("rapport_pdf"),
        "date_creation": row.get("date_creation"),
        "date_validation": row.get("date_validation"),
        "processus": {
            "id_processus": row["id_processus"],
            "code_process": row["code_process"],
            "nom": row["processus_nom"],
            "type_process": row["type_process"],
        },
        "redacteur": {
            "id_user": row.get("id_redacteur"),
            "nom": row.get("redacteur_nom"),
            "prenom": row.get("redacteur_prenom"),
        },
        "departement": {
            "id_departement": row.get("id_departement"),
            "nom": row.get("departement_nom"),
        },
        "bucket": status_key,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fiches_audit_list(request):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                vf.id_version,
                vf.numero_version,
                vf.statut AS statut_fiche,
                vf.date_creation,
                vf.date_validation,
                p.id_processus,
                p.code_process,
                p.nom AS processus_nom,
                p.type_process,
                d.id_departement,
                d.nom AS departement_nom,
                u.id_user AS id_redacteur,
                u.nom AS redacteur_nom,
                u.prenom AS redacteur_prenom,
                CASE
                    WHEN at.date_realisation IS NOT NULL THEN 'Cloture'
                    WHEN at.id_audit IS NOT NULL THEN 'En_cours'
                    ELSE 'Planifie'
                END AS audit_statut,
                at.rapport_pdf
            FROM version_fiche vf
            JOIN processus p ON p.id_processus = vf.id_processus
            LEFT JOIN departement d ON d.id_departement = p.id_departement
            LEFT JOIN utilisateur u ON u.id_user = vf.id_redacteur
            LEFT JOIN LATERAL (
                SELECT id_audit, date_realisation, rapport_pdf
                FROM audit_terrain
                WHERE audit_terrain.id_processus = vf.id_processus
                ORDER BY created_at DESC NULLS LAST, id_audit DESC
                LIMIT 1
            ) at ON TRUE
            WHERE vf.statut IN ('Soumise', 'En_revision', 'Publiee')
            ORDER BY
                CASE vf.statut
                    WHEN 'Soumise' THEN 1
                    WHEN 'En_revision' THEN 2
                    WHEN 'Publiee' THEN 3
                    ELSE 4
                END,
                vf.date_validation DESC NULLS LAST,
                vf.date_creation DESC NULLS LAST
            """
        )
        rows = dictfetchall(cursor)

    grouped = {"soumise": [], "en_revision": [], "publiee_audit": []}
    for row in rows:
        card = serialize_fiche_card(row)
        grouped[card["bucket"]].append(card)

    return Response(grouped)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fiche_audit_detail(request, id_version):
    detail = load_fiche_audit_detail(id_version)
    if not detail:
        return Response({"detail": "Fiche introuvable."}, status=status.HTTP_404_NOT_FOUND)
    return Response(detail)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fiche_audit_report(request, id_version):
    detail = load_fiche_audit_detail(id_version)
    if not detail:
        return Response({"detail": "Fiche introuvable."}, status=status.HTTP_404_NOT_FOUND)

    html = render_report_html(detail)
    disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
    filename = detail["rapport"]["fichier"]

    response = HttpResponse(html, content_type="text/html; charset=utf-8")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_audit_draft(request, id_version):
    auditeur_id = get_auditeur_id(request)
    if not auditeur_id:
        return Response({"detail": "Auditeur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    payload = request.data or {}
    evaluations = payload.get("evaluations", {})

    with transaction.atomic(), connection.cursor() as cursor:
        update_version_status(cursor, id_version, "En_revision")
        upsert_audit_terrain(cursor, id_version, auditeur_id, "En_cours", payload.get("recommendations", ""))
        replace_evaluations(cursor, id_version, auditeur_id, evaluations)
        replace_non_conformities(
            cursor,
            id_version,
            auditeur_id,
            payload.get("nonConformities", []),
            payload.get("correctiveActions", []),
        )

    return Response({"ok": True, "id_version": id_version, "status": "En_revision"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_audit_execution(request, id_version):
    auditeur_id = get_auditeur_id(request)
    if not auditeur_id:
        return Response({"detail": "Auditeur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    payload = request.data or {}
    evaluations = payload.get("evaluations", {})
    action = (payload.get("action") or "").strip().lower()

    if action not in {"publish", "send_back"}:
        return Response(
            {"detail": "Action de fin d'audit invalide."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic(), connection.cursor() as cursor:
        replace_evaluations(cursor, id_version, auditeur_id, evaluations)
        replace_non_conformities(
            cursor,
            id_version,
            auditeur_id,
            payload.get("nonConformities", []),
            payload.get("correctiveActions", []),
        )

        if action == "send_back":
            update_version_status(cursor, id_version, "En_revision")
            upsert_audit_terrain(
                cursor,
                id_version,
                auditeur_id,
                "En_cours",
                payload.get("recommendations", ""),
            )
            result_status = "En_revision"
            report_name = None
        else:
            update_version_status(cursor, id_version, "Publiee")
            report_name = ensure_report_reference(cursor, id_version)
            upsert_audit_terrain(
                cursor,
                id_version,
                auditeur_id,
                "Cloture",
                payload.get("recommendations", ""),
                report_name,
            )
            result_status = "Publiee"

    return Response(
        {
            "ok": True,
            "id_version": id_version,
            "status": result_status,
            "rapport_pdf": report_name,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_nc(request, id_version):
    auditeur_id = get_auditeur_id(request)
    if not auditeur_id:
        return Response({"detail": "Auditeur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    title = request.data.get("titre") or request.data.get("title")
    if not title:
        return Response({"detail": "Le titre de la NC est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    severity = request.data.get("severity")
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO nc (id_version, id_auditeur, id_exigence, titre, description)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id_nc, id_version, id_auditeur, id_exigence, titre, description, date_detection
            """,
            [
                id_version,
                auditeur_id,
                request.data.get("id_exigence"),
                compose_nc_title(title, severity),
                request.data.get("description", ""),
            ],
        )
        nc = dictfetchone(cursor)

    parsed_title, parsed_severity = parse_nc_title(nc["titre"])
    nc["titre"] = parsed_title
    nc["severity"] = parsed_severity
    return Response(nc, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_action_corrective(request, id_nc):
    description = request.data.get("description")
    if not description:
        return Response({"detail": "La description est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    db_status = ACTION_STATUS_TO_DB.get(request.data.get("statut"), "Planifiee")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO action_corrective (id_nc, id_responsable, description, statut, date_echeance)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id_action, id_nc, id_responsable, description, statut, date_echeance
            """,
            [
                id_nc,
                request.data.get("id_responsable"),
                description,
                db_status,
                empty_to_none(request.data.get("date_echeance")),
            ],
        )
        action = dictfetchone(cursor)

    action["statut_ui"] = ACTION_STATUS_FROM_DB.get(action["statut"], action["statut"])
    return Response(action, status=status.HTTP_201_CREATED)


def load_fiche_audit_detail(id_version):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                vf.id_version,
                vf.numero_version,
                vf.statut,
                vf.date_creation,
                vf.date_derniere_modif,
                vf.date_validation,
                p.id_processus,
                p.code_process,
                p.nom AS processus_nom,
                p.type_process,
                d.id_departement,
                d.nom AS departement_nom,
                u.id_user AS id_redacteur,
                u.nom AS redacteur_nom,
                u.prenom AS redacteur_prenom,
                pilote.id_user AS id_pilote,
                pilote.nom AS pilote_nom,
                pilote.prenom AS pilote_prenom,
                at.id_audit,
                CASE
                    WHEN at.date_realisation IS NOT NULL THEN 'Cloture'
                    WHEN at.id_audit IS NOT NULL THEN 'En_cours'
                    ELSE 'Planifie'
                END AS audit_statut,
                at.rapport_pdf,
                at.observations,
                at.date_realisation,
                at.created_at AS audit_created_at,
                auditeur.id_user AS id_auditeur,
                auditeur.nom AS auditeur_nom,
                auditeur.prenom AS auditeur_prenom
            FROM version_fiche vf
            JOIN processus p ON p.id_processus = vf.id_processus
            LEFT JOIN departement d ON d.id_departement = p.id_departement
            LEFT JOIN utilisateur u ON u.id_user = vf.id_redacteur
            LEFT JOIN utilisateur pilote ON pilote.id_user = p.id_pilote
            LEFT JOIN LATERAL (
                SELECT *
                FROM audit_terrain
                WHERE audit_terrain.id_processus = vf.id_processus
                ORDER BY created_at DESC NULLS LAST, id_audit DESC
                LIMIT 1
            ) at ON TRUE
            LEFT JOIN utilisateur auditeur ON auditeur.id_user = at.id_auditeur
            WHERE vf.id_version = %s
            """,
            [id_version],
        )
        fiche = dictfetchone(cursor)

        if not fiche:
            return None

        cursor.execute(
            """
            SELECT
                st.id_section_template,
                st.nom AS section_nom,
                st.ordre AS section_ordre,
                cf.id_champ,
                cf.libelle,
                cf.type_champ,
                cf.valeur,
                cf.valeur_json,
                cf.est_obligatoire,
                COALESCE(cf.ordre, ct.ordre, 1) AS champ_ordre,
                cf.id_champ_template
            FROM champ_fiche cf
            LEFT JOIN champ_template ct ON ct.id_champ_template = cf.id_champ_template
            LEFT JOIN section_template st ON st.id_section_template = ct.id_section_template
            WHERE cf.id_version = %s
            ORDER BY st.ordre NULLS LAST, COALESCE(cf.ordre, ct.ordre, 1), cf.id_champ
            """,
            [id_version],
        )
        champ_rows = dictfetchall(cursor)

        cursor.execute(
            """
            SELECT id_section_template, nom, ordre
            FROM section_template
            WHERE est_actif = TRUE
            ORDER BY ordre, id_section_template
            """
        )
        template_sections = dictfetchall(cursor)

        exigences = []
        if table_exists(cursor, "exigence") and table_exists(cursor, "article"):
            cursor.execute(
                """
                SELECT
                    e.id_exigence,
                    e.description,
                    e.est_obligatoire,
                    e.ponderation,
                    a.id_article,
                    a.code_article,
                    a.titre AS article_titre
                FROM exigence e
                LEFT JOIN article a ON a.id_article = e.id_article
                ORDER BY a.code_article, e.id_exigence
                """
            )
            exigences = dictfetchall(cursor)

        evaluations = []
        if table_exists(cursor, "checklist_evaluation"):
            if table_has_column(cursor, "checklist_evaluation", "id_exigence"):
                cursor.execute(
                    """
                    SELECT id_evaluation, id_exigence, resultat, commentaire, date_evaluation
                    FROM checklist_evaluation
                    WHERE id_version = %s
                    ORDER BY id_evaluation
                    """,
                    [id_version],
                )
            else:
                cursor.execute(
                    """
                    SELECT id_evaluation, NULL::integer AS id_exigence, resultat, commentaire, date_evaluation
                    FROM checklist_evaluation
                    WHERE id_version = %s
                    ORDER BY id_evaluation
                    """,
                    [id_version],
                )
            evaluations = dictfetchall(cursor)

        non_conformites = []
        if table_exists(cursor, "nc"):
            if table_has_column(cursor, "nc", "id_exigence"):
                cursor.execute(
                    """
                    SELECT id_nc, id_exigence, titre, description, date_detection, date_cloture
                    FROM nc
                    WHERE id_version = %s
                    ORDER BY date_detection DESC NULLS LAST, id_nc DESC
                    """,
                    [id_version],
                )
            else:
                cursor.execute(
                    """
                    SELECT id_nc, NULL::integer AS id_exigence, titre, description, date_detection, date_cloture
                    FROM nc
                    WHERE id_version = %s
                    ORDER BY date_detection DESC NULLS LAST, id_nc DESC
                    """,
                    [id_version],
                )
            non_conformites = dictfetchall(cursor)

        cursor.execute(
            """
            SELECT
                ac.id_action,
                ac.id_nc,
                ac.id_responsable,
                ac.description,
                ac.statut,
                ac.date_echeance,
                resp.nom AS responsable_nom,
                resp.prenom AS responsable_prenom
            FROM action_corrective ac
            JOIN nc ON nc.id_nc = ac.id_nc
            LEFT JOIN utilisateur resp ON resp.id_user = ac.id_responsable
            WHERE nc.id_version = %s
            ORDER BY ac.id_action
            """,
            [id_version],
        )
        actions = dictfetchall(cursor)

    sections = build_sections(champ_rows, template_sections)
    section_requirements = distribute_requirements_by_section(exigences, sections)
    requirement_to_section = {}
    for section in section_requirements:
        for requirement in section["requirements"]:
            requirement_to_section[str(requirement["id_exigence"])] = section["nom"]

    actions_by_nc = defaultdict(list)
    for action in actions:
        actions_by_nc[action["id_nc"]].append(
            {
                "id_action": action["id_action"],
                "description": action["description"],
                "statut": ACTION_STATUS_FROM_DB.get(action["statut"], action["statut"]),
                "date_echeance": action["date_echeance"],
                "responsable": format_user(action.get("responsable_prenom"), action.get("responsable_nom")),
            }
        )

    normalized_nc = []
    for item in non_conformites:
        parsed_title, severity = parse_nc_title(item["titre"])
        normalized_nc.append(
            {
                "id_nc": item["id_nc"],
                "id_exigence": item["id_exigence"],
                "titre": parsed_title,
                "description": item["description"],
                "date_detection": item["date_detection"],
                "date_cloture": item["date_cloture"],
                "gravite": severity or "Non renseignée",
                "section": requirement_to_section.get(str(item["id_exigence"])) or "Section non liée",
                "actions_correctives": actions_by_nc.get(item["id_nc"], []),
            }
        )

    taux_conformite = calculate_compliance_rate(evaluations)
    report_file = fiche.get("rapport_pdf") or default_report_filename(fiche["id_version"], fiche["code_process"])

    detail = {
        "id_version": fiche["id_version"],
        "numero_version": fiche["numero_version"],
        "statut": fiche["statut"],
        "date_creation": fiche["date_creation"],
        "date_derniere_modif": fiche.get("date_derniere_modif"),
        "date_validation": fiche.get("date_validation"),
        "audit_statut": fiche.get("audit_statut") or "Planifie",
        "processus": {
            "id_processus": fiche["id_processus"],
            "code_process": fiche["code_process"],
            "nom": fiche["processus_nom"],
            "type_process": fiche["type_process"],
            "departement": fiche.get("departement_nom"),
            "pilote": format_user(fiche.get("pilote_prenom"), fiche.get("pilote_nom")),
            "pilote_role": "Pilote de processus",
        },
        "redacteur": {
            "id_user": fiche.get("id_redacteur"),
            "nom": fiche.get("redacteur_nom"),
            "prenom": fiche.get("redacteur_prenom"),
            "role": "Pilote de processus",
        },
        "audit": {
            "id_audit": fiche.get("id_audit"),
            "statut": fiche.get("audit_statut") or "Planifie",
            "observations": fiche.get("observations") or "",
            "date_realisation": fiche.get("date_realisation"),
            "auditeur": {
                "id_user": fiche.get("id_auditeur"),
                "nom": fiche.get("auditeur_nom"),
                "prenom": fiche.get("auditeur_prenom"),
                "role": "Auditeur interne",
            },
        },
        "sections": sections,
        "section_requirements": section_requirements,
        "exigences": exigences,
        "evaluations": evaluations,
        "non_conformites": normalized_nc,
        "taux_conformite": taux_conformite,
        "rapport": {
            "titre": f"Rapport d'audit - {fiche['code_process']}",
            "fichier": report_file,
            "genere_le": fiche.get("date_realisation") or fiche.get("date_validation") or fiche.get("date_creation"),
            "mention": "Genere automatiquement lors de l'audit",
        },
    }
    return detail


def build_sections(champ_rows, template_sections=None):
    template_sections = template_sections or []
    sections_by_id = {
        section["id_section_template"]: {
            "id_section_template": section["id_section_template"],
            "nom": section["nom"],
            "ordre": section["ordre"],
            "champs": [],
        }
        for section in template_sections
    }
    fallback_section = {
        "id_section_template": None,
        "nom": "Informations de la fiche",
        "ordre": 999,
        "champs": [],
    }

    for row in champ_rows:
        section_id = row["id_section_template"] or find_legacy_section_id(row["libelle"], template_sections)
        if section_id is None:
            section = fallback_section
        else:
            section = sections_by_id.setdefault(
                section_id,
                {
                    "id_section_template": section_id,
                    "nom": row["section_nom"],
                    "ordre": row["section_ordre"],
                    "champs": [],
                },
            )

        section["champs"].append(
            {
                "id_champ": row["id_champ"],
                "id_champ_template": row["id_champ_template"],
                "libelle": row["libelle"],
                "type_champ": row["type_champ"],
                "valeur": row["valeur_json"] if row["valeur_json"] is not None else row["valeur"],
                "est_obligatoire": row["est_obligatoire"],
                "ordre": row["champ_ordre"],
            }
        )

    sections = sorted(sections_by_id.values(), key=lambda section: section["ordre"] or 999)
    if fallback_section["champs"]:
        sections.append(fallback_section)
    return sections


LEGACY_SECTION_FIELDS = {
    "Contexte de l'organisme": {
        "Désignation du processus",
        "Objectif du processus",
        "Description",
        "Enjeux",
        "Processus voisins",
        "Type de processus",
    },
    "Leadership": {
        "Pilote du processus",
        "Structures concernées",
        "Compétences clés",
    },
    "Planification": {
        "Risques",
        "Causes",
        "Conséquences",
        "Niveau de risque",
        "Contraintes",
        "Améliorations",
    },
    "Support": {
        "Ressources",
        "Moyens alloués",
        "Effectifs impliqués",
        "Coût estimé",
        "Délai global",
    },
    "Réalisation des activités": {
        "Les entrées",
        "Les sorties (Produits / Services)",
        "Tâches — Grandes étapes chronologiques",
        "Clients",
    },
    "Évaluation des performances": {
        "KPI",
    },
    "Documents et preuves": {
        "Documents de référence",
        "Enregistrements",
        "Cartographie BPMN",
        "Autres documents",
    },
}


def find_legacy_section_id(field_label, template_sections):
    for section in template_sections:
        labels = LEGACY_SECTION_FIELDS.get(section["nom"], set())
        if field_label in labels:
            return section["id_section_template"]
    return None


def distribute_requirements_by_section(exigences, sections):
    if not sections:
        return []

    buckets = [
        {
            "id_section_template": section["id_section_template"],
            "nom": section["nom"],
            "ordre": section["ordre"],
            "requirements": [],
        }
        for section in sections
    ]

    for index, exigence in enumerate(exigences):
        bucket = buckets[index % len(buckets)]
        bucket["requirements"].append(exigence)

    return buckets


def update_version_status(cursor, id_version, statut):
    cursor.execute(
        "UPDATE version_fiche SET statut = %s WHERE id_version = %s",
        [statut, id_version],
    )


def upsert_audit_terrain(cursor, id_version, auditeur_id, statut, observations, rapport_pdf=None):
    cursor.execute("SELECT id_processus FROM version_fiche WHERE id_version = %s", [id_version])
    row = cursor.fetchone()
    if not row:
        raise ValueError("Version fiche introuvable.")
    id_processus = row[0]

    cursor.execute(
        """
        SELECT id_audit
        FROM audit_terrain
        WHERE id_processus = %s AND id_auditeur = %s
        ORDER BY created_at DESC NULLS LAST, id_audit DESC
        LIMIT 1
        """,
        [id_processus, auditeur_id],
    )
    existing = cursor.fetchone()
    has_statut_column = audit_terrain_has_statut_column(cursor)

    if existing:
        if has_statut_column:
            cursor.execute(
                """
                UPDATE audit_terrain
                SET
                    statut = %s,
                    observations = %s,
                    rapport_pdf = COALESCE(%s, rapport_pdf),
                    date_realisation = CASE WHEN %s = 'Cloture' THEN CURRENT_DATE ELSE date_realisation END
                WHERE id_audit = %s
                """,
                [statut, observations, rapport_pdf, statut, existing[0]],
            )
        else:
            cursor.execute(
                """
                UPDATE audit_terrain
                SET
                    observations = %s,
                    rapport_pdf = COALESCE(%s, rapport_pdf),
                    date_realisation = CASE WHEN %s = 'Cloture' THEN CURRENT_DATE ELSE date_realisation END
                WHERE id_audit = %s
                """,
                [observations, rapport_pdf, statut, existing[0]],
            )
        return

    if has_statut_column:
        cursor.execute(
            """
            INSERT INTO audit_terrain (
                id_processus,
                id_auditeur,
                titre,
                statut,
                date_planifiee,
                date_realisation,
                observations,
                rapport_pdf
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                CURRENT_DATE,
                CASE WHEN %s = 'Cloture' THEN CURRENT_DATE ELSE NULL END,
                %s,
                %s
            )
            """,
            [
                id_processus,
                auditeur_id,
                f"Audit fiche processus #{id_version}",
                statut,
                statut,
                observations,
                rapport_pdf,
            ],
        )
        return

    cursor.execute(
        """
        INSERT INTO audit_terrain (
            id_processus,
            id_auditeur,
            titre,
            date_planifiee,
            date_realisation,
            observations,
            rapport_pdf
        )
        VALUES (
            %s,
            %s,
            %s,
            CURRENT_DATE,
            CASE WHEN %s = 'Cloture' THEN CURRENT_DATE ELSE NULL END,
            %s,
            %s
        )
        """,
        [
            id_processus,
            auditeur_id,
            f"Audit fiche processus #{id_version}",
            statut,
            observations,
            rapport_pdf,
        ],
    )


def audit_terrain_has_statut_column(cursor):
    return table_has_column(cursor, "audit_terrain", "statut")


def table_exists(cursor, table_name):
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = %s
        )
        """,
        [table_name],
    )
    return cursor.fetchone()[0]


def table_has_column(cursor, table_name, column_name):
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = %s
              AND column_name = %s
        )
        """,
        [table_name, column_name],
    )
    return cursor.fetchone()[0]


def ensure_report_reference(cursor, id_version):
    cursor.execute(
        """
        SELECT p.code_process
        FROM version_fiche vf
        JOIN processus p ON p.id_processus = vf.id_processus
        WHERE vf.id_version = %s
        """,
        [id_version],
    )
    row = cursor.fetchone()
    code_process = row[0] if row else f"FICHE-{id_version}"
    return default_report_filename(id_version, code_process)


def replace_evaluations(cursor, id_version, auditeur_id, evaluations):
    if not table_exists(cursor, "checklist_evaluation"):
        return

    cursor.execute(
        "DELETE FROM checklist_evaluation WHERE id_version = %s AND id_auditeur = %s",
        [id_version, auditeur_id],
    )

    if not table_has_column(cursor, "checklist_evaluation", "id_exigence"):
        return

    for requirement_id, evaluation in evaluations.items():
        try:
            id_exigence = int(requirement_id)
        except (TypeError, ValueError):
            continue

        db_result = RESULT_TO_DB.get(evaluation.get("status"))
        if not db_result:
            continue

        cursor.execute(
            """
            INSERT INTO checklist_evaluation (id_version, id_auditeur, id_exigence, resultat, commentaire)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [id_version, auditeur_id, id_exigence, db_result, evaluation.get("observation", "")],
        )


def replace_non_conformities(cursor, id_version, auditeur_id, non_conformities, corrective_actions):
    if not table_exists(cursor, "nc"):
        return

    cursor.execute(
        """
        SELECT id_nc
        FROM nc
        WHERE id_version = %s AND id_auditeur = %s
        """,
        [id_version, auditeur_id],
    )
    existing_nc_ids = [row[0] for row in cursor.fetchall()]

    if existing_nc_ids:
        cursor.execute("DELETE FROM action_corrective WHERE id_nc = ANY(%s)", [existing_nc_ids])
        cursor.execute(
            "DELETE FROM nc WHERE id_version = %s AND id_auditeur = %s",
            [id_version, auditeur_id],
        )

    local_to_db_nc = {}
    has_id_exigence = table_has_column(cursor, "nc", "id_exigence")
    has_id_section_template = table_has_column(cursor, "nc", "id_section_template")

    for item in non_conformities:
        title = item.get("title") or item.get("titre")
        if not title:
            continue

        id_exigence = coerce_int(item.get("requirementId") or item.get("id_exigence"))
        id_section_template = coerce_int(item.get("sectionId") or item.get("id_section_template"))
        severity = item.get("severity") or item.get("gravite")
        insert_columns = ["id_version", "id_auditeur", "titre", "description"]
        values = [id_version, auditeur_id, compose_nc_title(title, severity), item.get("description", "")]

        if has_id_exigence:
            insert_columns.insert(2, "id_exigence")
            values.insert(2, id_exigence)
        elif has_id_section_template:
            insert_columns.insert(2, "id_section_template")
            values.insert(2, id_section_template)

        placeholders = ", ".join(["%s"] * len(values))
        cursor.execute(
            f"""
            INSERT INTO nc ({", ".join(insert_columns)})
            VALUES ({placeholders})
            RETURNING id_nc
            """,
            values,
        )
        id_nc = cursor.fetchone()[0]
        local_to_db_nc[str(item.get("id"))] = id_nc

    for action in corrective_actions:
        id_nc = local_to_db_nc.get(str(action.get("ncId")))
        description = action.get("description")
        if not id_nc or not description:
            continue

        cursor.execute(
            """
            INSERT INTO action_corrective (id_nc, description, statut, date_echeance)
            VALUES (%s, %s, %s, %s)
            """,
            [
                id_nc,
                description,
                ACTION_STATUS_TO_DB.get(action.get("status"), "Planifiee"),
                empty_to_none(action.get("dueDate")),
            ],
        )


def render_report_html(detail):
    status_labels = {
        "conforme": "Conforme",
        "partiel": "Partiellement conforme",
        "non_conforme": "Non conforme",
        "non_applicable": "Non applicable",
    }

    section_title_by_requirement = {}
    for section in detail.get("section_requirements", []):
        for requirement in section.get("requirements", []):
            section_title_by_requirement[str(requirement["id_exigence"])] = section["nom"]

    evaluation_by_requirement = {
        str(item["id_exigence"]): item for item in detail.get("evaluations", [])
    }

    requirement_rows = []
    for requirement in detail.get("exigences", []):
        evaluation = evaluation_by_requirement.get(str(requirement["id_exigence"]), {})
        requirement_rows.append(
            f"""
            <tr>
              <td>{section_title_by_requirement.get(str(requirement["id_exigence"]), "Section non liée")}</td>
              <td>{requirement.get("code_article") or f"EX-{requirement['id_exigence']}"}</td>
              <td>{requirement["description"]}</td>
              <td>{status_labels.get(DB_TO_UI_RESULT.get(evaluation.get("resultat")), "Non coté")}</td>
            </tr>
            """
        )

    nc_rows = []
    for item in detail.get("non_conformites", []):
        nc_rows.append(
            f"""
            <tr>
              <td>{item["section"]}</td>
              <td>{item["titre"]}</td>
              <td>{item.get("description") or ""}</td>
              <td>{item.get("gravite") or "Non renseignée"}</td>
            </tr>
            """
        )

    actions = []
    for item in detail.get("non_conformites", []):
        for action in item.get("actions_correctives", []):
            actions.append(
                f"<li><strong>{item['titre']}</strong> - {action.get('description') or 'Action à préciser'} ({action.get('statut') or 'A faire'})</li>"
            )

    return f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>{detail["rapport"]["titre"]}</title>
    <style>
      body{{font-family:Arial,sans-serif;color:#1f2937;margin:32px}}
      h1{{color:#4c1d95}}
      h2{{margin-top:24px;color:#111827}}
      table{{width:100%;border-collapse:collapse;margin-top:16px}}
      th,td{{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:13px;vertical-align:top}}
      th{{background:#f3f0ff;color:#4c1d95}}
      .score{{font-size:28px;color:#047857;font-weight:700}}
    </style>
  </head>
  <body>
    <h1>{detail["rapport"]["titre"]}</h1>
    <p><strong>Code :</strong> {detail["processus"]["code_process"]}</p>
    <p><strong>Processus :</strong> {detail["processus"]["nom"]}</p>
    <p><strong>Pilote :</strong> {detail["processus"].get("pilote") or "Non renseigné"}</p>
    <p><strong>Auditeur :</strong> {format_user(detail["audit"]["auditeur"].get("prenom"), detail["audit"]["auditeur"].get("nom")) or "Non renseigné"}</p>
    <p><strong>Date :</strong> {detail["audit"].get("date_realisation") or detail.get("date_validation") or detail.get("date_creation") or ""}</p>
    <p class="score">Taux de conformité : {detail["taux_conformite"]}%</p>

    <h2>Exigences évaluées</h2>
    <table>
      <thead>
        <tr><th>Section</th><th>Réf.</th><th>Critère</th><th>Résultat</th></tr>
      </thead>
      <tbody>{''.join(requirement_rows) or "<tr><td colspan='4'>Aucune exigence disponible.</td></tr>"}</tbody>
    </table>

    <h2>Observations de l'auditeur</h2>
    <p>{detail["audit"].get("observations") or "Aucune observation globale saisie."}</p>

    <h2>Actions correctives</h2>
    <ul>{''.join(actions) or "<li>Aucune action corrective liée à une NC saisie.</li>"}</ul>

    <h2>Non-conformités relevées</h2>
    <table>
      <thead>
        <tr><th>Section</th><th>Titre</th><th>Description</th><th>Gravité</th></tr>
      </thead>
      <tbody>{''.join(nc_rows) or "<tr><td colspan='4'>Aucune NC relevée.</td></tr>"}</tbody>
    </table>
  </body>
</html>"""


def calculate_compliance_rate(evaluations):
    applicable = [item for item in evaluations if item.get("resultat") and item.get("resultat") != "NA"]
    if not applicable:
        return 0
    conformes = sum(1 for item in applicable if item.get("resultat") == "Conforme")
    partiels = sum(1 for item in applicable if item.get("resultat") == "Partiel")
    return round(((conformes + partiels * 0.5) / len(applicable)) * 100)


def compose_nc_title(title, severity):
    clean_title = (title or "").strip()
    if severity in SEVERITY_VALUES:
        return f"[{severity}] {clean_title}"
    return clean_title


def parse_nc_title(title):
    title = title or ""
    for severity in SEVERITY_VALUES:
        prefix = f"[{severity}] "
        if title.startswith(prefix):
            return title[len(prefix) :], severity
    return title, None


def default_report_filename(id_version, code_process):
    safe_code = (code_process or f"fiche-{id_version}").replace(" ", "-")
    return f"rapport-audit-{safe_code}-v{id_version}.html"


def coerce_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def empty_to_none(value):
    return None if value in ("", None) else value


def format_user(prenom, nom):
    return " ".join(part for part in [prenom, nom] if part)
