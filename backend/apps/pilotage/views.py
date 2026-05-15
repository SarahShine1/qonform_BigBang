from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


EVALUATION_SCORE = {"Conforme": 100, "Partiel": 50, "Non_conforme": 0}


def _dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _load_conformity(cursor, version_ids):
    """Returns {id_version: score_0_to_100} for the given version ids."""
    if not version_ids:
        return {}
    scores = {}
    cursor.execute(
        """
        SELECT id_version, resultat
        FROM checklist_evaluation
        WHERE id_version = ANY(%s)
          AND resultat IS NOT NULL AND resultat <> 'NA'
        """,
        [version_ids],
    )
    raw = {}
    for row in _dictfetchall(cursor):
        s = EVALUATION_SCORE.get(row["resultat"])
        if s is not None:
            raw.setdefault(row["id_version"], []).append(s)
    cursor.execute(
        """
        SELECT id_version, evaluation AS resultat
        FROM document
        WHERE id_version = ANY(%s)
          AND type_document IN ('BPMN', 'Preuve')
          AND evaluation IS NOT NULL AND evaluation <> 'NA'
        """,
        [version_ids],
    )
    for row in _dictfetchall(cursor):
        s = EVALUATION_SCORE.get(row["resultat"])
        if s is not None:
            raw.setdefault(row["id_version"], []).append(s)
    return {
        vid: round(sum(vals) / len(vals))
        for vid, vals in raw.items()
        if vals
    }


def _get_user_info(request):
    """Returns (id_user, id_departement) for the authenticated user."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_user, id_departement
            FROM utilisateur
            WHERE auth_id = %s OR email = %s
            LIMIT 1
            """,
            [request.user.id, getattr(request.user, "email", "")],
        )
        row = cursor.fetchone()
    if row:
        return row[0], row[1]
    return None, None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pilote_dashboard(request):
    user_id, user_dept = _get_user_info(request)
    if not user_id:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    empty = {
        "kpis": {"totalProcessus": 0, "brouillon": 0, "enAttente": 0, "publiee": 0},
        "statutDistribution": [],
        "ncParProcessus": [],
        "tachesAVenir": [],
        "timeline": [],
    }

    with connection.cursor() as cursor:

        # ── Active norm ───────────────────────────────────────────────────────
        cursor.execute("SELECT id_norme FROM norme WHERE est_active = TRUE LIMIT 1")
        row = cursor.fetchone()
        active_norme_id = row[0] if row else None

        # ── Processus du département du pilote ────────────────────────────────
        if user_dept:
            cursor.execute(
                """
                SELECT p.id_processus, p.code_process, p.nom AS processus_nom, p.type_process
                FROM processus p
                WHERE p.id_departement = %s
                ORDER BY p.nom
                """,
                [user_dept],
            )
        else:
            # Pas de département renseigné — processus assignés au pilote en fallback
            cursor.execute(
                """
                SELECT p.id_processus, p.code_process, p.nom AS processus_nom, p.type_process
                FROM processus p
                WHERE p.id_pilote = %s
                ORDER BY p.nom
                """,
                [user_id],
            )
        processus_list = _dictfetchall(cursor)

        # ── Upcoming tasks ────────────────────────────────────────────────────
        cursor.execute(
            """
            SELECT intitule, date_fin, priorite, statut
            FROM tache_planifiee
            WHERE id_responsable = %s
              AND statut NOT IN ('Terminée', 'Annulée')
              AND date_fin >= CURRENT_DATE
            ORDER BY date_fin ASC
            LIMIT 6
            """,
            [user_id],
        )
        taches_rows = _dictfetchall(cursor)
        taches = [
            {
                "intitule": t["intitule"],
                "date_fin": str(t["date_fin"]) if t["date_fin"] else None,
                "priorite": t["priorite"],
                "statut":   t["statut"],
            }
            for t in taches_rows
        ]

        if not processus_list:
            return Response({**empty, "tachesAVenir": taches})

        processus_ids = [p["id_processus"] for p in processus_list]
        processus_map = {p["id_processus"]: p for p in processus_list}

        # ── Version fiche — filtered by active norm when available ────────────
        if active_norme_id:
            cursor.execute(
                """
                SELECT
                    vf.id_version,
                    vf.id_processus,
                    vf.statut,
                    vf.numero_version,
                    vf.date_derniere_modif,
                    vf.date_creation
                FROM version_fiche vf
                WHERE vf.id_processus = ANY(%s)
                  AND vf.id_norme = %s
                ORDER BY vf.id_processus,
                         vf.date_creation DESC NULLS LAST,
                         vf.id_version DESC
                """,
                [processus_ids, active_norme_id],
            )
        else:
            cursor.execute(
                """
                SELECT
                    vf.id_version,
                    vf.id_processus,
                    vf.statut,
                    vf.numero_version,
                    vf.date_derniere_modif,
                    vf.date_creation
                FROM version_fiche vf
                WHERE vf.id_processus = ANY(%s)
                ORDER BY vf.id_processus,
                         vf.date_creation DESC NULLS LAST,
                         vf.id_version DESC
                """,
                [processus_ids],
            )
        all_versions = _dictfetchall(cursor)

        # Latest version per processus
        latest_by_pid = {}
        for v in all_versions:
            pid = v["id_processus"]
            if pid not in latest_by_pid:
                latest_by_pid[pid] = v

        # ── NC counts per processus (via norm-filtered versions) ──────────────
        version_ids = [v["id_version"] for v in all_versions]
        nc_by_pid = {}
        if version_ids:
            cursor.execute(
                """
                SELECT vf.id_processus, COUNT(nc.id_nc) AS nb
                FROM nc
                JOIN version_fiche vf ON vf.id_version = nc.id_version
                WHERE nc.id_version = ANY(%s)
                GROUP BY vf.id_processus
                """,
                [version_ids],
            )
            nc_by_pid = {r["id_processus"]: r["nb"] for r in _dictfetchall(cursor)}

        # ── Conformity scores for latest version of each processus ─────────────
        published_ids = [
            v["id_version"]
            for v in latest_by_pid.values()
            if v.get("statut") == "Publiee"
        ]
        conformity_by_version = _load_conformity(cursor, published_ids)

    # ── KPIs ──────────────────────────────────────────────────────────────────
    kpi_brouillon = kpi_en_attente = kpi_publiee = 0
    for pid in processus_ids:
        v = latest_by_pid.get(pid)
        if not v:
            continue
        s = v["statut"]
        if s == "Brouillon":
            kpi_brouillon += 1
        elif s in ("Soumise", "En_revision"):
            kpi_en_attente += 1
        elif s == "Publiee":
            kpi_publiee += 1

    # ── Statut distribution (for donut chart) ─────────────────────────────────
    statut_groups = {}
    for pid in processus_ids:
        v = latest_by_pid.get(pid)
        statut = v["statut"] if v else "Sans version"
        if statut not in statut_groups:
            statut_groups[statut] = {"statut": statut, "count": 0, "processus": []}
        statut_groups[statut]["count"] += 1
        statut_groups[statut]["processus"].append(processus_map[pid]["processus_nom"])

    statut_distribution = sorted(statut_groups.values(), key=lambda x: -x["count"])

    # ── NC per processus (for bar chart) ──────────────────────────────────────
    nc_par_processus = sorted(
        [
            {
                "id_processus": pid,
                "nom": processus_map[pid]["processus_nom"],
                "code": processus_map[pid]["code_process"],
                "nbNC": nc_by_pid.get(pid, 0),
            }
            for pid in processus_ids
        ],
        key=lambda x: -x["nbNC"],
    )

    # ── Conformity per processus (for horizontal bar chart) ───────────────────
    conformite_par_processus = []
    for pid in processus_ids:
        latest = latest_by_pid.get(pid)
        taux = None
        if latest and latest.get("statut") == "Publiee":
            taux = conformity_by_version.get(latest["id_version"])
        conformite_par_processus.append({
            "id_processus": pid,
            "nom": processus_map[pid]["processus_nom"],
            "code": processus_map[pid]["code_process"],
            "taux": taux,
        })
    # Sort: processus with a score first (desc), then unaudited
    conformite_par_processus.sort(
        key=lambda x: (x["taux"] is None, -(x["taux"] or 0))
    )

    # ── Timeline (20 most recent version events) ──────────────────────────────
    def _sort_key(v):
        return v.get("date_derniere_modif") or v.get("date_creation") or ""

    timeline = []
    for v in sorted(all_versions, key=_sort_key, reverse=True)[:20]:
        pid = v["id_processus"]
        p = processus_map.get(pid, {})
        timeline.append({
            "date": v.get("date_derniere_modif") or v.get("date_creation"),
            "processus": p.get("processus_nom", ""),
            "version": v["numero_version"],
            "statut": v["statut"],
            "id_processus": pid,
        })

    return Response({
        "kpis": {
            "totalProcessus": len(processus_ids),
            "brouillon": kpi_brouillon,
            "enAttente": kpi_en_attente,
            "publiee": kpi_publiee,
        },
        "statutDistribution": statut_distribution,
        "ncParProcessus": nc_par_processus,
        "conformiteParProcessus": conformite_par_processus,
        "tachesAVenir": taches,
        "timeline": timeline,
    })
