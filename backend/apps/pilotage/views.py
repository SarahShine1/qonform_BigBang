from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.maturity.models import MaturityRequirementResponse
from collections import defaultdict
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
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dg_dashboard(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS total FROM processus")
        total_processus = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(DISTINCT id_processus) AS total
            FROM version_fiche
            WHERE statut = 'Publiee'
        """)
        processus_publies = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM audit_terrain
            WHERE date_realisation IS NOT NULL
        """)
        audits_clotures = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COUNT(*) 
            FROM processus_liaison
        """)
        interactions_definies = cursor.fetchone()[0]


        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM version_fiche
            WHERE statut = 'Publiee'
        """)

        
        audits_total = cursor.fetchone()[0]

        cursor.execute("""
            SELECT id_version
            FROM version_fiche
            WHERE statut = 'Publiee'
        """)
        cursor.execute("""
            SELECT COUNT(*)
            FROM version_fiche
            WHERE statut = 'En révision'
        """)

        en_revision = cursor.fetchone()[0]
        
        version_ids = [row[0] for row in cursor.fetchall()]

        conformity_by_version = _load_conformity(cursor, version_ids)
        scores = list(conformity_by_version.values())
        taux_conformite = round(sum(scores) / len(scores)) if scores else 0

    processus_publies_taux = round((processus_publies / total_processus) * 100) if total_processus else 0
    audits_clotures_taux = round((audits_clotures / audits_total) * 100) if audits_total else 0

    scores_maturite = MaturityRequirementResponse.objects.values_list("score", flat=True)

    maturite_score = (
        round(sum(scores_maturite) / len(scores_maturite))
        if scores_maturite
        else 0
    )
    avancement_global = round(
        (processus_publies_taux * 0.30)
        + (taux_conformite * 0.35)
        + (audits_clotures_taux * 0.20)
        + (maturite_score * 0.15)
    )

    return Response({
        "taux_processus_publies": round((processus_publies / total_processus) * 100) if total_processus else 0,
        "processus_en_revision": en_revision,
        "taux_processus_revision": round((en_revision / total_processus) * 100) if total_processus else 0,
        "interactions_definies": interactions_definies,
        "taux_interactions": round((interactions_definies / total_processus) * 100) if total_processus else 0,
        "avancement_global": avancement_global,

        "processus_publies": f"{processus_publies}/{total_processus}",
        "processus_publies_taux": processus_publies_taux,

        "audits_clotures": f"{audits_clotures}/{audits_total}",
        "audits_clotures_taux": audits_clotures_taux,

        "conformite_iso": taux_conformite,
        "processus_actifs": total_processus,

        "maturite_globale": f"{max(1, round(maturite_score / 20))}/5" if maturite_score else "0/5",        "maturite_score": maturite_score,

        "modules": [
            {"name": "Cartographie", "value": processus_publies_taux},
            {"name": "Documentation", "value": processus_publies_taux},
            {"name": "Audit", "value": audits_clotures_taux},
            {"name": "Conformité ISO", "value": taux_conformite},
            {"name": "Maturité", "value": maturite_score},
        ],

        "month_comparison": [
            {"day": "01", "thisMonth": 22, "previousMonth": 16},
            {"day": "05", "thisMonth": 35, "previousMonth": 26},
            {"day": "10", "thisMonth": 48, "previousMonth": 38},
            {"day": "15", "thisMonth": 61, "previousMonth": 44},
            {"day": "20", "thisMonth": 72, "previousMonth": 58},
            {"day": "25", "thisMonth": 78, "previousMonth": 67},
            {"day": "30", "thisMonth": 83, "previousMonth": 71},
        ],
    })

   
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def caq_dashboard(request):
    """
    GET /api/v1/pilotage/caq/dashboard/
 
    Renvoie toutes les métriques pour le DashboardCAQ.jsx :
      - kpis
      - ficheStatus
      - processusByType
      - tasksDistribution
      - departmentStatus
    """
    with connection.cursor() as cursor:
 
        # 1. Total processus
        cursor.execute("SELECT COUNT(*) FROM processus")
        total_processus = cursor.fetchone()[0] or 0
        cursor.execute("SELECT type_process FROM processus")
        all_processus_types = _dictfetchall(cursor)
 
        # 2. Versions fiches actives + type processus + département
        cursor.execute(
            """
            SELECT
                vf.id_version,
                vf.statut,
                p.type_process,
                d.nom AS departement_nom
            FROM version_fiche vf
            JOIN processus p       ON p.id_processus   = vf.id_processus
            LEFT JOIN departement d ON d.id_departement = p.id_departement
            WHERE vf.statut IN ('Brouillon', 'Soumise', 'En_revision', 'Publiee')
            """
        )
        fiches = _dictfetchall(cursor)
 
        # 3. Scores de conformité (uniquement les Publiées)
        published_ids = [f["id_version"] for f in fiches if f["statut"] == "Publiee"]
        conformity_by_version = _load_conformity(cursor, published_ids)
 
        # 4. Tâches planifiées (toutes)
        cursor.execute("SELECT statut FROM tache_planifiee")
        all_tasks = _dictfetchall(cursor)
 
        # 5. NC ouvertes
        cursor.execute(
            "SELECT COUNT(*) FROM nc WHERE date_cloture IS NULL"
        )
        total_nc_ouvertes = cursor.fetchone()[0] or 0
 
    # ── Calculs ───────────────────────────────────────────────────────────────
 
    # ficheStatus
    fiche_counts = {"Publiee": 0, "En_revision": 0, "Soumise": 0, "Brouillon": 0}
    for f in fiches:
        if f["statut"] in fiche_counts:
            fiche_counts[f["statut"]] += 1
 
    total_fiches = sum(fiche_counts.values()) or 1
    fiches_publiees_taux = round((fiche_counts["Publiee"] / total_fiches) * 100)
 
    # processusByType
    type_counts = defaultdict(int)
    for p in all_processus_types:
        type_counts[p.get("type_process") or "Autre"] += 1
 
    processus_by_type = [
        {"name": name, "value": count}
        for name, count in sorted(type_counts.items())
    ]
 
    # departmentStatus
    dept_map = defaultdict(
        lambda: {"publiee": 0, "en_revision": 0, "soumise": 0, "brouillon": 0}
    )
    for f in fiches:
        dept = f.get("departement_nom") or "Non assigné"
        s = f["statut"]
        if s == "Publiee":        dept_map[dept]["publiee"]     += 1
        elif s == "En_revision":  dept_map[dept]["en_revision"] += 1
        elif s == "Soumise":      dept_map[dept]["soumise"]     += 1
        elif s == "Brouillon":    dept_map[dept]["brouillon"]   += 1
 
    department_status = [
        {"department": dept, **counts}
        for dept, counts in sorted(dept_map.items())
    ]
 
    # tasksDistribution — mapping identique aux STATUT_CHOICES du modèle
    task_dist = {"Terminée": 0, "En cours": 0, "En attente": 0, "Annulée": 0}
    task_total = len(all_tasks)
    task_done  = 0
 
    for t in all_tasks:
        raw = (t.get("statut") or "").strip()
        if raw == "Terminée":
            task_dist["Terminée"] += 1
            task_done += 1
        elif raw == "En cours":
            task_dist["En cours"] += 1
        elif raw == "Annulée":
            task_dist["Annulée"] += 1
        else:
            # "Planifiée" → "En attente" dans l'UI
            task_dist["En attente"] += 1
 
    taux_avancement = round((task_done / task_total) * 100) if task_total else 0
 
    tasks_distribution = [
        {"name": name, "value": value}
        for name, value in task_dist.items()
    ]
 
    # tauxConformiteGlobal
    scores = list(conformity_by_version.values())
    taux_conformite_global = round(sum(scores) / len(scores)) if scores else 0
 
    # ── Réponse ───────────────────────────────────────────────────────────────
    return Response(
        {
            "kpis": {
                "totalProcessus":       total_processus,
                "fichesPubblieeTaux":   fiches_publiees_taux,
                "tauxAvancementTaches": taux_avancement,
                "nonConformites":       total_nc_ouvertes,
                "tauxConformiteGlobal": taux_conformite_global,
            },
            # Clés identiques au MOCK_DATA.ficheStatus du frontend
            "ficheStatus": {
                "Publiee":    fiche_counts["Publiee"],
                "EnRevision": fiche_counts["En_revision"],
                "Soumise":    fiche_counts["Soumise"],
                "Brouillon":  fiche_counts["Brouillon"],
            },
            "processusByType":   processus_by_type,
            "tasksDistribution": tasks_distribution,
            "departmentStatus":  department_status,
        }
    )
 
