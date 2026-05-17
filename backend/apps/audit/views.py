from collections import defaultdict
from datetime import date
from html import escape
import unicodedata

from django.db import connection, transaction
from django.http import StreamingHttpResponse
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

DEFAULT_AUDIT_CRITERIA = [
    "Contexte coherent avec les enjeux ESI",
    "Risques : criticite P x I correcte et plan de traitement",
    "Responsabilites du pilote claires",
    "Competences RH definies et mappees",
    "Dysfonctionnements avec action corrective",
]

EVALUATION_SCORE = {
    "Conforme": 100,
    "Partiel": 50,
    "Non_conforme": 0,
}

CONFORMITY_WEIGHTS = {
    "completion": 0.40,
    "checklist": 0.30,
    "bpmn": 0.15,
    "proofs": 0.15,
}

SECTION_WEIGHTS = {
    "contexte de lorganisation": 15,
    "contexte de lorganisme": 15,
    "leadership": 10,
    "planification": 15,
    "support": 10,
    "realisation des activites operationnelles": 25,
    "realisation des activites": 25,
    "evaluation des performances": 10,
    "amelioration": 10,
    "ameliorations": 10,
    "documents et preuves": 5,
}


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
        "revue": bool(row.get("revue")),
        "audit_kind": "reaudit" if row.get("revue") else "new",
        "auditeur": {
            "id_user": row.get("id_auditeur"),
            "nom": row.get("auditeur_nom"),
            "prenom": row.get("auditeur_prenom"),
        }
        if row.get("id_auditeur")
        else None,
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
                vf.revue,
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
                at.rapport_pdf,
                COALESCE(audit_owner.id_auditeur, at.id_auditeur) AS id_auditeur
                ,auditeur.nom AS auditeur_nom
                ,auditeur.prenom AS auditeur_prenom
            FROM version_fiche vf
            JOIN processus p ON p.id_processus = vf.id_processus
            LEFT JOIN departement d ON d.id_departement = p.id_departement
            LEFT JOIN utilisateur u ON u.id_user = vf.id_redacteur
            LEFT JOIN LATERAL (
                SELECT id_audit, id_auditeur, date_realisation, rapport_pdf
                FROM audit_terrain
                WHERE audit_terrain.id_processus = vf.id_processus
                ORDER BY created_at DESC NULLS LAST, id_audit DESC
                LIMIT 1
            ) at ON TRUE
            LEFT JOIN LATERAL (
                SELECT owner.id_auditeur
                FROM (
                    SELECT ce.id_auditeur, MAX(ce.date_evaluation) AS activity_date
                    FROM checklist_evaluation ce
                    WHERE ce.id_version = vf.id_version
                    GROUP BY ce.id_auditeur

                    UNION ALL

                    SELECT nc.id_auditeur, MAX(nc.date_detection) AS activity_date
                    FROM nc
                    WHERE nc.id_version = vf.id_version
                    GROUP BY nc.id_auditeur

                    UNION ALL

                    SELECT at2.id_auditeur, MAX(at2.created_at) AS activity_date
                    FROM audit_terrain at2
                    WHERE at2.id_processus = vf.id_processus
                    GROUP BY at2.id_auditeur
                ) owner
                WHERE owner.id_auditeur IS NOT NULL
                ORDER BY owner.activity_date DESC NULLS LAST
                LIMIT 1
            ) audit_owner ON TRUE
            LEFT JOIN utilisateur auditeur ON auditeur.id_user = COALESCE(audit_owner.id_auditeur, at.id_auditeur)
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

    # Use a streaming response so Django Debug Toolbar cannot inject its panel
    # into the report HTML while DEBUG=True.
    response = StreamingHttpResponse([html], content_type="text/html; charset=utf-8")
    response["Content-Disposition"] = f'{disposition}; filename="{filename}"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def criteres_by_section(request, id_section):
    with connection.cursor() as cursor:
        if not table_exists(cursor, "critere_evaluation"):
            return Response([])

        if not table_has_column(cursor, "critere_evaluation", "id_section_template"):
            return Response([])

        cursor.execute(
            """
            SELECT id_critere, nom, est_actif, id_section_template
            FROM critere_evaluation
            WHERE est_actif = TRUE
              AND id_section_template = %s
            ORDER BY id_critere
            """,
            [id_section],
        )
        rows = dictfetchall(cursor)

    return Response(
        [
            {
                "id_critere": row["id_critere"],
                "id_exigence": row["id_critere"],
                "description": row["nom"],
                "nom": row["nom"],
                "id_section_template": row["id_section_template"],
                "est_obligatoire": True,
                "ponderation": 1,
                "code_article": f"CR-{row['id_critere']}",
                "article_titre": "Critère d'audit",
            }
            for row in rows
        ]
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_dashboard(request):
    auditeur_id = get_auditeur_id(request)
    if not auditeur_id:
        return Response({"detail": "Auditeur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    today = date.today()
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS total FROM processus")
        total_processus = dictfetchone(cursor)["total"] or 0

        cursor.execute(
            """
            SELECT
                vf.id_version,
                vf.id_processus,
                vf.numero_version,
                vf.statut,
                vf.revue,
                vf.date_creation,
                vf.date_validation,
                p.code_process,
                p.nom AS processus_nom,
                d.nom AS departement_nom,
                doc.nom_fichier AS rapport_nom,
                doc.date_upload AS rapport_date,
                at.date_realisation
            FROM version_fiche vf
            JOIN processus p ON p.id_processus = vf.id_processus
            LEFT JOIN departement d ON d.id_departement = p.id_departement
            LEFT JOIN LATERAL (
                SELECT id_audit, date_realisation
                FROM audit_terrain
                WHERE audit_terrain.id_processus = vf.id_processus
                  AND audit_terrain.id_auditeur = %s
                ORDER BY created_at DESC NULLS LAST, id_audit DESC
                LIMIT 1
            ) at ON TRUE
            LEFT JOIN LATERAL (
                SELECT nom_fichier, date_upload
                FROM document
                WHERE document.id_version = vf.id_version
                  AND document.type_document = 'Rapport_audit_fiche'
                ORDER BY date_upload DESC NULLS LAST, id_document DESC
                LIMIT 1
            ) doc ON TRUE
            WHERE vf.statut IN ('Soumise', 'En_revision', 'Publiee')
            ORDER BY vf.date_creation DESC NULLS LAST, vf.id_version DESC
            """,
            [auditeur_id],
        )
        fiches = dictfetchall(cursor)

        version_ids = [row["id_version"] for row in fiches]
        conformity_by_version = load_conformity_scores(cursor, version_ids)

        cursor.execute(
            """
            SELECT statut, priorite, date_fin
            FROM tache_planifiee
            WHERE id_responsable = %s
            """,
            [auditeur_id],
        )
        taches = dictfetchall(cursor)

        cursor.execute(
            """
            SELECT id_tache, intitule, type_tache, priorite, statut, date_debut, date_fin
            FROM tache_planifiee
            WHERE id_responsable = %s
            ORDER BY date_fin ASC, id_tache DESC
            LIMIT 8
            """,
            [auditeur_id],
        )
        taches_planifiees = dictfetchall(cursor)

        cursor.execute(
            """
            SELECT nc.id_nc, nc.titre, nc.date_cloture
            FROM nc
            WHERE nc.id_auditeur = %s
            """,
            [auditeur_id],
        )
        ncs = dictfetchall(cursor)

        cursor.execute(
            """
            SELECT ce.resultat, ce.id_critere, c.nom AS critere_nom, st.nom AS section_nom
            FROM checklist_evaluation ce
            LEFT JOIN critere_evaluation c ON c.id_critere = ce.id_critere
            LEFT JOIN section_template st ON st.id_section_template = ce.id_section_template
            WHERE ce.id_auditeur = %s
            """,
            [auditeur_id],
        )
        evaluations = dictfetchall(cursor)

    published = [row for row in fiches if row["statut"] == "Publiee"]
    audited_process_ids = {row["id_processus"] for row in published}
    coverage = round((len(audited_process_ids) / total_processus) * 100) if total_processus else 0
    soumises = [row for row in fiches if row["statut"] == "Soumise"]
    en_revision = [row for row in fiches if row["statut"] == "En_revision"]
    reauditer = [row for row in soumises if row.get("revue")]
    final_scores = [conformity_by_version.get(row["id_version"], 0) for row in published]
    average_conformity = round(sum(final_scores) / len(final_scores)) if final_scores else 0

    task_stats = build_task_stats(taches, today)
    resultats = build_result_categories(final_scores)
    nc_gravite = build_nc_gravity(ncs)
    clause_scores = build_clause_scores(evaluations)
    evolution = build_audit_evolution(published)
    rapports = build_recent_reports(published, conformity_by_version)

    alertes = [
        {"type": "warning", "message": f"{len(reauditer)} fiche(s) corrigée(s) attendent un réaudit."},
        {"type": "danger", "message": f"{task_stats['en_retard']} tâche(s) sont en retard."},
        {"type": "danger", "message": f"{nc_gravite.get('Majeure', 0) + nc_gravite.get('Critique', 0)} NC majeures ou critiques sont ouvertes."},
        {
            "type": "info",
            "message": f"{sum(1 for row in published if not row.get('rapport_nom'))} audit(s) publié(s) n'ont pas encore de rapport référencé.",
        },
    ]

    return Response(
        {
            "kpis": {
                "processusAudites": len(audited_process_ids),
                "totalProcessus": total_processus,
                "couverture": coverage,
                "fichesAAuditer": len(soumises),
                "auditsEnCours": len(en_revision),
                "fichesAReauditer": len(reauditer),
                "tachesEnRetard": task_stats["en_retard"],
                "tachesPrioritaires": task_stats["prioritaires"],
            },
            "progressionAudits": {
                "audites": len(audited_process_ids),
                "restants": max(total_processus - len(audited_process_ids), 0),
                "pourcentage": coverage,
            },
            "fichesParStatut": [
                {"label": "Soumises", "value": len([row for row in soumises if not row.get("revue")])},
                {"label": "En cours d'audit", "value": len(en_revision)},
                {"label": "À réauditer", "value": len(reauditer)},
                {"label": "Auditées / publiées", "value": len(published)},
            ],
            "tachesParStatut": [
                {"label": "À faire", "value": task_stats["a_faire"]},
                {"label": "En cours", "value": task_stats["en_cours"]},
                {"label": "En retard", "value": task_stats["en_retard"]},
                {"label": "Terminées", "value": task_stats["terminees"]},
            ],
            "tachesParPriorite": [
                {"label": "Haute", "value": task_stats["priorite_haute"]},
                {"label": "Moyenne", "value": task_stats["priorite_moyenne"]},
                {"label": "Basse", "value": task_stats["priorite_basse"]},
            ],
            "tauxMoyenConformite": average_conformity,
            "resultatsAudits": resultats,
            "ncParGravite": [{"label": key, "value": value} for key, value in nc_gravite.items()],
            "conformiteParClause": clause_scores,
            "evolutionAudits": evolution,
            "tachesPlanifiees": serialize_dashboard_tasks(taches_planifiees, today),
            "alertes": alertes,
            "rapportsRecents": rapports,
        }
    )


def load_conformity_scores(cursor, version_ids):
    if not version_ids:
        return {}

    scores = defaultdict(list)
    cursor.execute(
        """
        SELECT id_version, resultat
        FROM checklist_evaluation
        WHERE id_version = ANY(%s)
          AND resultat IS NOT NULL
          AND resultat <> 'NA'
        """,
        [version_ids],
    )
    for row in dictfetchall(cursor):
        score = EVALUATION_SCORE.get(row["resultat"])
        if score is not None:
            scores[row["id_version"]].append(score)

    cursor.execute(
        """
        SELECT id_version, evaluation AS resultat
        FROM document
        WHERE id_version = ANY(%s)
          AND type_document IN ('BPMN', 'Preuve')
          AND evaluation IS NOT NULL
          AND evaluation <> 'NA'
        """,
        [version_ids],
    )
    for row in dictfetchall(cursor):
        score = EVALUATION_SCORE.get(row["resultat"])
        if score is not None:
            scores[row["id_version"]].append(score)

    return {
        version_id: round(sum(values) / len(values))
        for version_id, values in scores.items()
        if values
    }


def normalize_task_status(value):
    normalized = str(value or "").strip().lower()
    normalized = normalized.replace("é", "e").replace("è", "e").replace("ê", "e")
    if "termin" in normalized:
        return "terminee"
    if "cours" in normalized:
        return "en_cours"
    if "annul" in normalized:
        return "annulee"
    return "a_faire"


def build_task_stats(taches, today):
    stats = {
        "a_faire": 0,
        "en_cours": 0,
        "en_retard": 0,
        "terminees": 0,
        "prioritaires": 0,
        "priorite_haute": 0,
        "priorite_moyenne": 0,
        "priorite_basse": 0,
    }
    for task in taches:
        status_key = normalize_task_status(task.get("statut"))
        if status_key == "terminee":
            stats["terminees"] += 1
        elif status_key == "en_cours":
            stats["en_cours"] += 1
        else:
            stats["a_faire"] += 1

        if task.get("date_fin") and task["date_fin"] < today and status_key != "terminee":
            stats["en_retard"] += 1

        priority = str(task.get("priorite") or "").lower()
        if "haute" in priority:
            stats["priorite_haute"] += 1
            stats["prioritaires"] += 1
        elif "basse" in priority:
            stats["priorite_basse"] += 1
        else:
            stats["priorite_moyenne"] += 1
    return stats


def build_result_categories(scores):
    categories = {
        "Conforme": 0,
        "Quasi-conforme": 0,
        "En progression": 0,
        "Non-conforme": 0,
    }
    for score in scores:
        if score >= 90:
            categories["Conforme"] += 1
        elif score >= 75:
            categories["Quasi-conforme"] += 1
        elif score >= 60:
            categories["En progression"] += 1
        else:
            categories["Non-conforme"] += 1
    return [{"label": key, "value": value} for key, value in categories.items()]


def build_nc_gravity(ncs):
    counts = {"Mineure": 0, "Majeure": 0, "Critique": 0}
    for item in ncs:
        if item.get("date_cloture"):
            continue
        _, severity = parse_nc_title(item.get("titre"))
        counts[severity or "Mineure"] = counts.get(severity or "Mineure", 0) + 1
    return counts


ISO_AXES = [
    ("§4.4 Processus du SMQ", ("processus", "smq", "contexte")),
    ("§6.1 Risques et opportunites", ("risque", "opportun")),
    ("§6.2 Objectifs qualite", ("objectif", "qualite")),
    ("§7.5 Informations documentees", ("document", "preuve", "enregistrement")),
    ("§9.1 Surveillance et mesure", ("surveillance", "mesure", "kpi", "performance")),
    ("§10.2 NC et actions correctives", ("dysfonction", "action corrective", "non-conform")),
]


def build_clause_scores(evaluations):
    buckets = {label: [] for label, _ in ISO_AXES}
    for item in evaluations:
        score = EVALUATION_SCORE.get(item.get("resultat"))
        if score is None:
            continue
        text = f"{item.get('critere_nom') or ''} {item.get('section_nom') or ''}".lower()
        for label, keywords in ISO_AXES:
            if any(keyword in text for keyword in keywords):
                buckets[label].append(score)
                break

    return [
        {
            "label": label,
            "value": round(sum(values) / len(values)) if values else 0,
        }
        for label, values in buckets.items()
    ]


MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]


def build_audit_evolution(published):
    counts = defaultdict(int)
    for row in published:
        date_value = row.get("date_realisation") or row.get("date_validation") or row.get("rapport_date")
        if not date_value:
            continue
        key = (date_value.year, date_value.month)
        counts[key] += 1

    if not counts:
        return []

    return [
        {"label": f"{MONTH_LABELS[month - 1]} {str(year)[-2:]}", "value": counts[(year, month)]}
        for year, month in sorted(counts.keys())[-12:]
    ]


def build_recent_reports(published, conformity_by_version):
    reports = [row for row in published if row.get("rapport_nom")]
    reports.sort(key=lambda row: date_sort_value(row.get("rapport_date") or row.get("date_validation")), reverse=True)
    return [
        {
            "id_version": row["id_version"],
            "nom": row.get("rapport_nom") or f"Rapport audit - {row.get('code_process')}",
            "processus": row.get("processus_nom"),
            "date": row.get("rapport_date") or row.get("date_validation"),
            "taux": conformity_by_version.get(row["id_version"], 0),
        }
        for row in reports[:5]
    ]


def date_sort_value(value):
    if not value:
        return date.min.toordinal()
    if hasattr(value, "date"):
        value = value.date()
    return value.toordinal()


def serialize_dashboard_tasks(tasks, today):
    items = []
    for task in tasks:
        status_key = normalize_task_status(task.get("statut"))
        items.append(
            {
                "id": task.get("id_tache"),
                "intitule": task.get("intitule"),
                "type": task.get("type_tache"),
                "priorite": task.get("priorite"),
                "statut": task.get("statut"),
                "date_debut": task.get("date_debut"),
                "date_fin": task.get("date_fin"),
                "en_retard": bool(task.get("date_fin") and task["date_fin"] < today and status_key != "terminee"),
            }
        )
    return items


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_audit_execution(request, id_version):
    auditeur_id = get_auditeur_id(request)
    if not auditeur_id:
        return Response({"detail": "Auditeur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    payload = request.data or {}
    with transaction.atomic(), connection.cursor() as cursor:
        update_version_status(cursor, id_version, "En_revision")
        update_version_commit(cursor, id_version, payload.get("currentIndex", 0))
        upsert_audit_terrain(cursor, id_version, auditeur_id, "En_cours", "")

    return Response({"ok": True, "id_version": id_version, "status": "En_revision"})


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
        update_version_commit(cursor, id_version, payload.get("currentIndex"))
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
            update_version_status(cursor, id_version, "Brouillon", revue=True)
            upsert_audit_terrain(
                cursor,
                id_version,
                auditeur_id,
                "En_cours",
                payload.get("recommendations", ""),
            )
            result_status = "Brouillon"
            report_name = None
        else:
            update_version_status(cursor, id_version, "Publiee", revue=False)
            report_name = ensure_report_reference(cursor, id_version, auditeur_id)
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
        has_version_norme = table_has_column(cursor, "version_fiche", "id_norme")
        norme_select = "vf.id_norme" if has_version_norme else "NULL::integer AS id_norme"
        cursor.execute(
            f"""
            SELECT
                vf.id_version,
                {norme_select},
                vf.numero_version,
                vf.statut,
                vf."commit" AS audit_commit,
                vf.revue,
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

        has_section_norme = table_has_column(cursor, "section_template", "id_norme")
        if has_section_norme and fiche.get("id_norme"):
            cursor.execute(
                """
                SELECT id_section_template, nom, ordre
                FROM section_template
                WHERE est_actif = TRUE
                  AND id_norme = %s
                ORDER BY ordre, id_section_template
                """,
                [fiche["id_norme"]],
            )
            template_sections = dictfetchall(cursor)
            if not template_sections:
                cursor.execute(
                    """
                    SELECT id_section_template, nom, ordre
                    FROM section_template
                    WHERE est_actif = TRUE
                    ORDER BY ordre, id_section_template
                    """
                )
                template_sections = dictfetchall(cursor)
        else:
            cursor.execute(
                """
                SELECT id_section_template, nom, ordre
                FROM section_template
                WHERE est_actif = TRUE
                ORDER BY ordre, id_section_template
                """
            )
            template_sections = dictfetchall(cursor)

        criteres = []
        if table_exists(cursor, "critere_evaluation"):
            has_critere_section = table_has_column(cursor, "critere_evaluation", "id_section_template")
            if has_critere_section:
                cursor.execute(
                    """
                    SELECT id_critere, nom, est_actif, id_section_template
                    FROM critere_evaluation
                    WHERE est_actif = TRUE
                      AND id_section_template IS NOT NULL
                    ORDER BY id_critere
                    """
                )
                criteres = dictfetchall(cursor)

        exigences = []
        if criteres:
            exigences = [
                {
                    "id_critere": item["id_critere"],
                    "id_exigence": item["id_critere"],
                    "description": item["nom"],
                    "id_section_template": item.get("id_section_template"),
                    "est_obligatoire": True,
                    "ponderation": 1,
                    "code_article": f"CR-{item['id_critere']}",
                    "article_titre": "Critere d'audit",
                }
                for item in criteres
            ]
        elif table_exists(cursor, "exigence") and table_exists(cursor, "article"):
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
            if table_has_column(cursor, "checklist_evaluation", "id_critere"):
                cursor.execute(
                    """
                    SELECT
                        id_evaluation,
                        id_critere,
                        id_critere AS id_exigence,
                        id_section_template,
                        resultat,
                        commentaire,
                        date_evaluation
                    FROM checklist_evaluation
                    WHERE id_version = %s
                    ORDER BY id_evaluation
                    """,
                    [id_version],
                )
            elif table_has_column(cursor, "checklist_evaluation", "id_exigence"):
                cursor.execute(
                    """
                    SELECT
                        id_evaluation,
                        NULL::integer AS id_critere,
                        id_exigence,
                        NULL::integer AS id_section_template,
                        resultat,
                        commentaire,
                        date_evaluation
                    FROM checklist_evaluation
                    WHERE id_version = %s
                    ORDER BY id_evaluation
                    """,
                    [id_version],
                )
            else:
                cursor.execute(
                    """
                    SELECT
                        id_evaluation,
                        NULL::integer AS id_critere,
                        NULL::integer AS id_exigence,
                        id_section_template,
                        resultat,
                        commentaire,
                        date_evaluation
                    FROM checklist_evaluation
                    WHERE id_version = %s
                    ORDER BY id_evaluation
                    """,
                    [id_version],
                )
            evaluations = dictfetchall(cursor)

        documents = []
        if table_exists(cursor, "document"):
            select_parts = [
                "id_document",
                "id_version",
                "nom_fichier",
                "type_document",
                "chemin_stockage",
                "description",
                "date_upload",
            ]
            if table_has_column(cursor, "document", "evaluation"):
                select_parts.append("evaluation")
            else:
                select_parts.append("NULL::varchar AS evaluation")
            cursor.execute(
                f"""
                SELECT {", ".join(select_parts)}
                FROM document
                WHERE id_version = %s
                  AND type_document IN ('BPMN', 'Preuve', 'Rapport_audit_fiche')
                ORDER BY date_upload DESC NULLS LAST, id_document DESC
                """,
                [id_version],
            )
            documents = dictfetchall(cursor)

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
                    SELECT
                        id_nc,
                        NULL::integer AS id_exigence,
                        id_section_template,
                        titre,
                        description,
                        date_detection,
                        date_cloture
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
    apply_section_completion_rates(sections)
    section_requirements = distribute_requirements_by_section(exigences, sections)
    requirement_to_section = {}
    for section in section_requirements:
        for requirement in section["requirements"]:
            requirement_id = requirement.get("id_critere") or requirement.get("id_exigence")
            requirement_to_section[str(requirement_id)] = section["nom"]

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
        linked_section = "Section non liée"
        if item.get("id_exigence"):
            linked_section = requirement_to_section.get(str(item["id_exigence"]), linked_section)
        elif item.get("id_section_template"):
            linked_section = next(
                (
                    section["nom"]
                    for section in sections
                    if str(section.get("id_section_template")) == str(item.get("id_section_template"))
                ),
                linked_section,
            )
        normalized_nc.append(
            {
                "id_nc": item["id_nc"],
                "id_exigence": item["id_exigence"],
                "id_section_template": item.get("id_section_template"),
                "titre": parsed_title,
                "description": item["description"],
                "date_detection": item["date_detection"],
                "date_cloture": item["date_cloture"],
                "gravite": severity or "Non renseignée",
                "section": requirement_to_section.get(str(item["id_exigence"])) or "Section non liée",
                "actions_correctives": actions_by_nc.get(item["id_nc"], []),
            }
        )

    documents_grouped = group_audit_documents(documents)
    metrics = calculate_audit_metrics(sections, evaluations, documents_grouped, section_requirements)
    taux_conformite = metrics["taux_global"]
    report_file = fiche.get("rapport_pdf") or default_report_filename(fiche["id_version"], fiche["code_process"])

    detail = {
        "id_version": fiche["id_version"],
        "numero_version": fiche["numero_version"],
        "statut": fiche["statut"],
        "commit": fiche.get("audit_commit") or 0,
        "revue": bool(fiche.get("revue")),
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
        "documents": documents_grouped,
        "metrics": metrics,
        "non_conformites": normalized_nc,
        "taux_conformite": taux_conformite,
        "rapport": {
            "titre": f"Rapport d'audit - {fiche['code_process']}",
            "fichier": report_file,
            "genere_le": fiche.get("date_realisation") or fiche.get("date_validation") or fiche.get("date_creation"),
            "mention": "Généré automatiquement lors de l'audit",
        },
    }
    return detail


def ensure_default_audit_criteria(cursor):
    cursor.execute("SELECT nom FROM critere_evaluation")
    existing = {row[0] for row in cursor.fetchall()}
    for criterion in DEFAULT_AUDIT_CRITERIA:
        if criterion not in existing:
            cursor.execute(
                """
                INSERT INTO critere_evaluation (nom, est_actif)
                VALUES (%s, TRUE)
                """,
                [criterion],
            )


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

    buckets_by_id = {}
    buckets = [
        {
            "id_section_template": section["id_section_template"],
            "nom": section["nom"],
            "ordre": section["ordre"],
            "requirements": [],
        }
        for section in sections
    ]
    for bucket in buckets:
        if bucket["id_section_template"] is not None:
            buckets_by_id[str(bucket["id_section_template"])] = bucket

    for index, exigence in enumerate(exigences):
        section_id = exigence.get("id_section_template")
        bucket = buckets_by_id.get(str(section_id)) if section_id is not None else None
        if bucket is None:
            bucket = buckets[index % len(buckets)]
        bucket["requirements"].append(exigence)

    return buckets


def apply_section_completion_rates(sections):
    for section in sections:
        required_fields = [champ for champ in section.get("champs") or [] if champ.get("est_obligatoire")]
        if not required_fields:
            section["completion_rate"] = 100
            section["completion_done"] = 0
            section["completion_total"] = 0
            continue

        completed = sum(1 for champ in required_fields if is_value_filled(champ.get("valeur")))
        section["completion_rate"] = round((completed / len(required_fields)) * 100)
        section["completion_done"] = completed
        section["completion_total"] = len(required_fields)


def is_value_filled(value):
    if value is None:
        return False
    if isinstance(value, (list, tuple, dict)):
        return len(value) > 0
    return str(value).strip() != ""


def group_audit_documents(documents):
    grouped = {"bpmn": [], "preuves": [], "rapports": []}
    for document in documents:
        doc = {
            "id_document": document["id_document"],
            "id_version": document.get("id_version"),
            "nom_fichier": document.get("nom_fichier"),
            "type_document": document.get("type_document"),
            "chemin_stockage": document.get("chemin_stockage"),
            "description": document.get("description") or "",
            "date_upload": document.get("date_upload"),
            "evaluation": document.get("evaluation"),
        }
        if document.get("type_document") == "BPMN":
            grouped["bpmn"].append(doc)
        elif document.get("type_document") == "Preuve":
            grouped["preuves"].append(doc)
        elif document.get("type_document") == "Rapport_audit_fiche":
            grouped["rapports"].append(doc)
    return grouped


def calculate_audit_metrics(sections, evaluations, documents_grouped, section_requirements=None):
    section_scores = calculate_section_scores(sections, evaluations, section_requirements)
    completion = average_numbers([item["taux_completude"] for item in section_scores])
    checklist = average_numbers([item["taux_criteres"] for item in section_scores])
    bpmn = score_db_results(document.get("evaluation") for document in documents_grouped.get("bpmn", []))
    proofs = score_db_results(document.get("evaluation") for document in documents_grouped.get("preuves", []))

    weighted_sections = [item for item in section_scores if item["poids"] > 0]
    weight_total = sum(item["poids"] for item in weighted_sections)
    if weight_total:
        global_rate = round(sum(item["score"] * item["poids"] for item in weighted_sections) / weight_total)
    else:
        global_rate = round(average_numbers([item["score"] for item in section_scores]) or 0)

    return {
        "taux_completude_moyen": round(completion or 0),
        "score_checklist": round(checklist or 0),
        "score_bpmn": round(bpmn or 0),
        "score_preuves": round(proofs or 0),
        "taux_global": global_rate,
        "ponderation": SECTION_WEIGHTS,
        "sections": section_scores,
    }


def calculate_section_scores(sections, evaluations, section_requirements=None):
    requirement_to_section = {}
    for section in section_requirements or []:
        section_id = section.get("id_section_template")
        for requirement in section.get("requirements", []):
            requirement_id = requirement.get("id_critere") or requirement.get("id_exigence")
            if requirement_id is not None:
                requirement_to_section[str(requirement_id)] = section_id

    evaluations_by_section = defaultdict(list)
    for evaluation in evaluations:
        requirement_id = evaluation.get("id_critere") or evaluation.get("id_exigence")
        section_id = evaluation.get("id_section_template") or requirement_to_section.get(str(requirement_id))
        if section_id is not None:
            evaluations_by_section[str(section_id)].append(evaluation)

    scores = []
    for section in sections:
        section_id = section.get("id_section_template")
        section_evaluations = evaluations_by_section.get(str(section_id), [])
        taux_completude = section.get("completion_rate")
        if taux_completude is None:
            taux_completude = 100
        taux_criteres = calculate_section_criteria_rate(section_evaluations)
        score = round((0.6 * taux_completude) + (0.4 * taux_criteres))
        poids = get_section_weight(section.get("nom"))
        section["criteria_rate"] = taux_criteres
        section["score_section"] = score
        section["weight"] = poids
        scores.append(
            {
                "id_section_template": section_id,
                "nom": section.get("nom"),
                "taux_completude": round(taux_completude),
                "taux_criteres": round(taux_criteres),
                "score": score,
                "poids": poids,
            }
        )
    return scores


def calculate_section_criteria_rate(section_evaluations):
    if not section_evaluations:
        return 0

    applicable_scores = [
        EVALUATION_SCORE[evaluation["resultat"]]
        for evaluation in section_evaluations
        if evaluation.get("resultat") in EVALUATION_SCORE
    ]
    if not applicable_scores:
        return 100
    return sum(applicable_scores) / len(applicable_scores)


def get_section_weight(section_name):
    return SECTION_WEIGHTS.get(normalize_section_name(section_name), 0)


def normalize_section_name(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.lower().replace("’", "").replace("'", "")
    return " ".join("".join(char if char.isalnum() else " " for char in text).split())


def average_numbers(values):
    cleaned = [value for value in values if value is not None]
    if not cleaned:
        return None
    return sum(cleaned) / len(cleaned)


def score_db_results(results):
    scored = [EVALUATION_SCORE[result] for result in results if result in EVALUATION_SCORE]
    if not scored:
        return None
    return sum(scored) / len(scored)


def update_version_status(cursor, id_version, statut, revue=None):
    if revue is not None and table_has_column(cursor, "version_fiche", "revue"):
        cursor.execute(
            "UPDATE version_fiche SET statut = %s, revue = %s WHERE id_version = %s",
            [statut, revue, id_version],
        )
    else:
        cursor.execute(
            "UPDATE version_fiche SET statut = %s WHERE id_version = %s",
            [statut, id_version],
        )


def update_version_commit(cursor, id_version, commit_value):
    if commit_value is None or not table_has_column(cursor, "version_fiche", "commit"):
        return
    current_index = coerce_int(commit_value)
    if current_index is None:
        return
    cursor.execute(
        'UPDATE version_fiche SET "commit" = %s WHERE id_version = %s',
        [max(current_index, 0), id_version],
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


def ensure_report_reference(cursor, id_version, auditeur_id=None):
    cursor.execute(
        """
        SELECT p.code_process, p.nom, vf.numero_version
        FROM version_fiche vf
        JOIN processus p ON p.id_processus = vf.id_processus
        WHERE vf.id_version = %s
        """,
        [id_version],
    )
    row = cursor.fetchone()
    code_process = row[0] if row else f"FICHE-{id_version}"
    process_name = row[1] if row else f"Fiche {id_version}"
    filename = default_report_filename(id_version, code_process)

    if table_exists(cursor, "document"):
        cursor.execute(
            """
            SELECT id_document
            FROM document
            WHERE id_version = %s AND type_document = 'Rapport_audit_fiche'
            ORDER BY date_upload DESC NULLS LAST, id_document DESC
            LIMIT 1
            """,
            [id_version],
        )
        existing = cursor.fetchone()
        description = f"Rapport audit - {process_name} - version {row[2] if row else id_version}"

        if existing:
            cursor.execute(
                """
                UPDATE document
                SET nom_fichier = %s,
                    chemin_stockage = %s,
                    description = %s,
                    date_upload = NOW()
                WHERE id_document = %s
                """,
                [filename, filename, description, existing[0]],
            )
        elif auditeur_id:
            cursor.execute(
                """
                INSERT INTO document (
                    id_version,
                    id_uploader,
                    nom_fichier,
                    type_document,
                    chemin_stockage,
                    description,
                    date_upload
                )
                VALUES (%s, %s, %s, 'Rapport_audit_fiche', %s, %s, NOW())
                """,
                [id_version, auditeur_id, filename, filename, description],
            )

    return filename


def replace_evaluations(cursor, id_version, auditeur_id, evaluations):
    if not table_exists(cursor, "checklist_evaluation"):
        replace_document_evaluations(cursor, evaluations)
        return

    cursor.execute(
        "DELETE FROM checklist_evaluation WHERE id_version = %s AND id_auditeur = %s",
        [id_version, auditeur_id],
    )

    has_id_critere = table_has_column(cursor, "checklist_evaluation", "id_critere")
    has_id_exigence = table_has_column(cursor, "checklist_evaluation", "id_exigence")
    has_id_section_template = table_has_column(cursor, "checklist_evaluation", "id_section_template")

    for requirement_id, evaluation in evaluations.items():
        if str(requirement_id).startswith("doc-"):
            continue

        id_requirement = coerce_requirement_id(requirement_id)
        if id_requirement is None:
            continue
        db_result = RESULT_TO_DB.get(evaluation.get("status"))
        if not db_result:
            continue

        columns = ["id_version", "id_auditeur", "resultat", "commentaire"]
        values = [id_version, auditeur_id, db_result, evaluation.get("observation", "")]

        if has_id_critere:
            columns.insert(2, "id_critere")
            values.insert(2, id_requirement)
        elif has_id_exigence:
            columns.insert(2, "id_exigence")
            values.insert(2, id_requirement)
        else:
            continue

        section_id = coerce_int(evaluation.get("sectionId") or evaluation.get("id_section_template"))
        if has_id_section_template:
            columns.insert(3, "id_section_template")
            values.insert(3, section_id)

        placeholders = ", ".join(["%s"] * len(values))
        cursor.execute(
            f"""
            INSERT INTO checklist_evaluation ({", ".join(columns)})
            VALUES ({placeholders})
            """,
            values,
        )

    replace_document_evaluations(cursor, evaluations)


def replace_document_evaluations(cursor, evaluations):
    if not table_exists(cursor, "document") or not table_has_column(cursor, "document", "evaluation"):
        return

    for requirement_id, evaluation in evaluations.items():
        if not str(requirement_id).startswith("doc-"):
            continue
        id_document = coerce_int(str(requirement_id).replace("doc-", "", 1))
        db_result = RESULT_TO_DB.get(evaluation.get("status"))
        if not id_document or not db_result:
            continue
        cursor.execute(
            """
            UPDATE document
            SET evaluation = %s
            WHERE id_document = %s
              AND type_document IN ('BPMN', 'Preuve')
            """,
            [db_result, id_document],
        )


def coerce_requirement_id(requirement_id):
    text = str(requirement_id or "").strip()
    if text.startswith("critere-"):
        text = text.replace("critere-", "", 1)
    return coerce_int(text)


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
    def h(value):
        return escape(str(value or ""))

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

    metrics = detail.get("metrics") or {}
    conclusion = get_report_conclusion(detail.get("taux_conformite") or 0)

    return f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>{detail["rapport"]["titre"]}</title>
    <style>
      *{{box-sizing:border-box}}
      body{{font-family:Arial,sans-serif;color:#1f2937;margin:32px;background:#fff}}
      .audit-report-content{{max-width:980px;margin:0 auto}}
      nav,aside,button,svg,.no-print,.theme-toggle,.floating,.app-shell{{display:none!important}}
      h1{{color:#4c1d95}}
      h2{{margin-top:24px;color:#111827}}
      table{{width:100%;border-collapse:collapse;margin-top:16px}}
      th,td{{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:13px;vertical-align:top}}
      th{{background:#f3f0ff;color:#4c1d95}}
      .score{{font-size:28px;color:#047857;font-weight:700}}
      .metrics{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}}
      .metric{{border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fafafa}}
      .metric span{{display:block;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700}}
      .metric strong{{display:block;margin-top:6px;color:#4c1d95;font-size:18px}}
      @media print{{
        @page{{margin:14mm}}
        body{{margin:0}}
        nav,aside,button,svg,a[href="#"],.no-print,.theme-toggle,.floating,.app-shell{{display:none!important}}
        .audit-report-content{{max-width:none}}
        h1,h2{{break-after:avoid}}
        table,tr{{break-inside:avoid}}
      }}
    </style>
  </head>
  <body>
    <main class="audit-report-content">
    <h1>{detail["rapport"]["titre"]}</h1>
    <p><strong>Code :</strong> {detail["processus"]["code_process"]}</p>
    <p><strong>Processus :</strong> {detail["processus"]["nom"]}</p>
    <p><strong>Pilote :</strong> {detail["processus"].get("pilote") or "Non renseigné"}</p>
    <p><strong>Auditeur :</strong> {format_user(detail["audit"]["auditeur"].get("prenom"), detail["audit"]["auditeur"].get("nom")) or "Non renseigné"}</p>
    <p><strong>Date :</strong> {detail["audit"].get("date_realisation") or detail.get("date_validation") or detail.get("date_creation") or ""}</p>
    <div class="metrics">
      <div class="metric"><span>Complétude</span><strong>{metrics.get("taux_completude_moyen", 0)}%</strong></div>
      <div class="metric"><span>Checklist</span><strong>{metrics.get("score_checklist", 0)}%</strong></div>
      <div class="metric"><span>BPMN</span><strong>{metrics.get("score_bpmn", 0)}%</strong></div>
      <div class="metric"><span>Preuves</span><strong>{metrics.get("score_preuves", 0)}%</strong></div>
    </div>
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
    <h2>Conclusion</h2>
    <p>{h(conclusion)}</p>
    </main>
  </body>
</html>"""


def get_report_conclusion(rate):
    if rate >= 80:
        return "Fiche globalement conforme."
    if rate >= 50:
        return "Fiche partiellement conforme, améliorations nécessaires."
    return "Fiche non conforme, actions correctives prioritaires."


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
