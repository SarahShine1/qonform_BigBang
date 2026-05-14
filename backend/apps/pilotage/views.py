from collections import defaultdict

from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


EVALUATION_SCORE = {
    "Conforme": 100,
    "Partiel": 50,
    "Non_conforme": 0,
}


def _dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def _get_user_id(request):
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


def _load_conformity(cursor, version_ids):
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
    for row in _dictfetchall(cursor):
        s = EVALUATION_SCORE.get(row["resultat"])
        if s is not None:
            scores[row["id_version"]].append(s)
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
    for row in _dictfetchall(cursor):
        s = EVALUATION_SCORE.get(row["resultat"])
        if s is not None:
            scores[row["id_version"]].append(s)
    return {
        vid: round(sum(vals) / len(vals))
        for vid, vals in scores.items()
        if vals
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pilote_dashboard(request):
    user_id = _get_user_id(request)
    if not user_id:
        return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

    empty = {
        "kpis": {"totalProcessus": 0, "brouillon": 0, "enAttente": 0, "publiee": 0},
        "processus": [],
        "audit": {"tauxConformiteMoyen": None, "parProcessus": []},
        "timeline": [],
    }

    with connection.cursor() as cursor:
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

        if not processus_list:
            return Response(empty)

        processus_ids = [p["id_processus"] for p in processus_list]

        cursor.execute(
            """
            SELECT
                vf.id_version,
                vf.id_processus,
                vf.statut,
                vf.numero_version,
                vf.date_derniere_modif,
                vf.date_creation,
                n.code  AS norme_code,
                n.version AS norme_version
            FROM version_fiche vf
            LEFT JOIN norme n ON n.id_norme = vf.id_norme
            WHERE vf.id_processus = ANY(%s)
            ORDER BY vf.id_processus,
                     vf.date_creation DESC NULLS LAST,
                     vf.id_version DESC
            """,
            [processus_ids],
        )
        all_versions = _dictfetchall(cursor)

        # Latest version per processus (first row per pid, query is sorted desc)
        latest_by_pid = {}
        for v in all_versions:
            pid = v["id_processus"]
            if pid not in latest_by_pid:
                latest_by_pid[pid] = v

        # NC counts per processus
        cursor.execute(
            """
            SELECT vf.id_processus, COUNT(nc.id_nc) AS nb
            FROM nc
            JOIN version_fiche vf ON vf.id_version = nc.id_version
            WHERE vf.id_processus = ANY(%s)
            GROUP BY vf.id_processus
            """,
            [processus_ids],
        )
        nc_by_pid = {r["id_processus"]: r["nb"] for r in _dictfetchall(cursor)}

        # Action corrective counts per processus
        cursor.execute(
            """
            SELECT vf.id_processus, COUNT(ac.id_action) AS nb
            FROM action_corrective ac
            JOIN nc ON nc.id_nc = ac.id_nc
            JOIN version_fiche vf ON vf.id_version = nc.id_version
            WHERE vf.id_processus = ANY(%s)
            GROUP BY vf.id_processus
            """,
            [processus_ids],
        )
        actions_by_pid = {r["id_processus"]: r["nb"] for r in _dictfetchall(cursor)}

        # Conformity scores for published latest versions
        published_ids = [
            v["id_version"]
            for v in latest_by_pid.values()
            if v["statut"] == "Publiee"
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

    # ── Zone 2: processus table ───────────────────────────────────────────────
    processus_map = {p["id_processus"]: p for p in processus_list}
    zone2 = []
    for pid in processus_ids:
        p = processus_map[pid]
        latest = latest_by_pid.get(pid)
        norme_label = None
        if latest and latest.get("norme_code") and latest.get("norme_version"):
            norme_label = f"{latest['norme_code']}:{latest['norme_version']}"
        zone2.append({
            "id_processus": pid,
            "code_process": p["code_process"],
            "nom": p["processus_nom"],
            "type_process": p["type_process"],
            "latestVersion": {
                "id_version": latest["id_version"],
                "numero_version": latest["numero_version"],
                "statut": latest["statut"],
                "date_derniere_modif": latest["date_derniere_modif"],
                "norme": norme_label,
            } if latest else None,
        })

    # ── Zone 3: audit per processus ───────────────────────────────────────────
    all_scores = []
    par_processus = []
    for pid in processus_ids:
        p = processus_map[pid]
        latest = latest_by_pid.get(pid)
        taux = None
        if latest and latest["statut"] == "Publiee":
            taux = conformity_by_version.get(latest["id_version"])
            if taux is not None:
                all_scores.append(taux)
        par_processus.append({
            "id_processus": pid,
            "nom": p["processus_nom"],
            "nbNC": nc_by_pid.get(pid, 0),
            "nbActions": actions_by_pid.get(pid, 0),
            "taux": taux,
        })

    taux_moyen = (
        round(sum(all_scores) / len(all_scores)) if all_scores else None
    )

    # ── Zone 5: timeline ──────────────────────────────────────────────────────
    def _sort_key(v):
        return v.get("date_derniere_modif") or v.get("date_creation") or ""

    timeline = []
    for v in sorted(all_versions, key=_sort_key, reverse=True)[:20]:
        pid = v["id_processus"]
        p = processus_map.get(pid, {})
        timeline.append({
            "date": v.get("date_derniere_modif") or v.get("date_creation"),
            "processus": p.get("processus_nom", ""),
            "code_process": p.get("code_process", ""),
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
        "processus": zone2,
        "audit": {
            "tauxConformiteMoyen": taux_moyen,
            "parProcessus": par_processus,
        },
        "timeline": timeline,
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
 
