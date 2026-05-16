from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse

from .models import Norme, SectionTemplate, ChampTemplate, VersionFiche, ChampFiche, ProcessusLiaison
from .serializers import (
    NormeSerializer,
    SectionTemplateSerializer,
    ChampTemplateSerializer,
    ChampTemplateCreateSerializer,
    VersionFicheSerializer,
    ChampFicheSerializer,
)


class NormeViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/fiches/normes/              – liste des normes
    POST   /api/v1/fiches/normes/              – créer une norme
    GET    /api/v1/fiches/normes/{id}/         – détail
    PATCH  /api/v1/fiches/normes/{id}/         – modifier
    DELETE /api/v1/fiches/normes/{id}/         – supprimer
    POST   /api/v1/fiches/normes/{id}/toggle-active/  – changer la norme active
    """
    serializer_class = NormeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Norme.objects.all().order_by("created_at")

    @action(detail=True, methods=["post"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        norme = self.get_object()
        if norme.est_active:
            norme.est_active = False
            norme.save(update_fields=["est_active"])
        else:
            Norme.objects.all().update(est_active=False)
            norme.est_active = True
            norme.save(update_fields=["est_active"])
        return Response(NormeSerializer(norme).data)


class SectionTemplateViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/fiches/template/sections/                  – liste (filtrable par ?id_norme=)
    POST   /api/v1/fiches/template/sections/                  – créer une section
    PATCH  /api/v1/fiches/template/sections/{id}/             – modifier
    DELETE /api/v1/fiches/template/sections/{id}/             – soft-delete
    GET    /api/v1/fiches/template/sections/{id}/champs/      – champs d'une section
    """
    serializer_class = SectionTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        id_norme = self.request.query_params.get("id_norme")
        if id_norme:
            return SectionTemplate.objects.filter(
                est_actif=True, id_norme=id_norme
            ).order_by("ordre")

        active_norme_ids = Norme.objects.filter(est_active=True).values_list("id_norme", flat=True)
        return SectionTemplate.objects.filter(
            est_actif=True
        ).filter(
            Q(id_norme__isnull=True) | Q(id_norme__in=active_norme_ids)
        ).order_by("ordre")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.est_actif = False
        instance.save(update_fields=["est_actif"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="champs")
    def champs(self, request, pk=None):
        # Bypass norm-activity filter so archived versions can still fetch
        # champs for sections belonging to a no-longer-active norm.
        from django.shortcuts import get_object_or_404
        section = get_object_or_404(SectionTemplate, pk=pk, est_actif=True)
        champs = ChampTemplate.objects.filter(
            id_section_template=section.pk, est_actif=True
        ).order_by("ordre")
        return Response(ChampTemplateSerializer(champs, many=True).data)


class ChampTemplateViewSet(viewsets.ModelViewSet):
    """
    POST   /api/v1/fiches/template/champs/       – créer un champ (avec colonnes/options)
    PATCH  /api/v1/fiches/template/champs/{id}/  – modifier un champ
    DELETE /api/v1/fiches/template/champs/{id}/  – soft-delete
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return ChampTemplateCreateSerializer
        return ChampTemplateSerializer

    def get_queryset(self):
        return ChampTemplate.objects.filter(est_actif=True)

    def create(self, request, *args, **kwargs):
        serializer = ChampTemplateCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        champ = serializer.save()
        return Response(ChampTemplateSerializer(champ).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.est_actif = False
        instance.save(update_fields=["est_actif"])
        return Response(status=status.HTTP_204_NO_CONTENT)


def _sync_liaisons(id_processus, amont_ids, aval_ids):
    """Replace all liaisons for this processus with the provided lists."""
    ProcessusLiaison.objects.filter(id_processus_aval=id_processus).delete()
    ProcessusLiaison.objects.filter(id_processus_amont=id_processus).delete()
    for pid in amont_ids:
        ProcessusLiaison.objects.create(id_processus_amont=int(pid), id_processus_aval=id_processus)
    for pid in aval_ids:
        ProcessusLiaison.objects.create(id_processus_amont=id_processus, id_processus_aval=int(pid))


class VersionFicheViewSet(viewsets.ModelViewSet):
    """
    POST  /api/v1/fiches/                  – créer une fiche
    PATCH /api/v1/fiches/{id}/             – modifier une fiche
    GET   /api/v1/fiches/{id}/             – détail d'une fiche
    GET   /api/v1/fiches/{id}/champs/      – lire les champs remplis
    POST  /api/v1/fiches/{id}/champs/      – sauvegarder les champs (bulk upsert)
    """

    serializer_class = VersionFicheSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "report":
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = VersionFiche.objects.all()
        id_processus = self.request.query_params.get("id_processus")
        if id_processus:
            qs = qs.filter(id_processus=id_processus)
        return qs

    def _get_liaison_ids(self, key):
        val = self.request.data.get(key, [])
        if isinstance(val, str):
            import json
            try:
                val = json.loads(val)
            except Exception:
                val = []
        return [v for v in val if v]

    def perform_create(self, serializer):
        try:
            id_redacteur = self.request.user.utilisateur.id_user
        except Exception:
            id_redacteur = self.request.data.get("id_redacteur")
        # Auto-assign active norm if caller did not supply one
        id_norme = serializer.validated_data.get("id_norme") or (
            Norme.objects.filter(est_active=True)
            .values_list("id_norme", flat=True)
            .first()
        )
        instance = serializer.save(id_redacteur=id_redacteur, id_norme=id_norme)
        _sync_liaisons(
            instance.id_processus,
            self._get_liaison_ids("amont_ids"),
            self._get_liaison_ids("aval_ids"),
        )

    def perform_update(self, serializer):
        previous_statut = serializer.instance.statut
        instance = serializer.save()
        _sync_liaisons(
            instance.id_processus,
            self._get_liaison_ids("amont_ids"),
            self._get_liaison_ids("aval_ids"),
        )
        if previous_statut != "Soumise" and instance.statut == "Soumise":
            from apps.notifications.utils import notifier_auditeurs_soumission
            notifier_auditeurs_soumission(instance)

    @action(detail=True, methods=["get", "post"], url_path="champs")
    def champs(self, request, pk=None):
        version = self.get_object()

        if request.method == "GET":
            champs = ChampFiche.objects.filter(id_version=version.pk).order_by("ordre")
            return Response(ChampFicheSerializer(champs, many=True).data)

        payload = request.data if isinstance(request.data, list) else [request.data]
        saved = []

        for item in payload:
            item["id_version"] = version.pk
            id_tpl = item.get("id_champ_template")

            existing = (
                ChampFiche.objects.filter(
                    id_version=version.pk, id_champ_template=id_tpl
                ).first()
                if id_tpl
                else None
            )

            serializer = (
                ChampFicheSerializer(existing, data=item, partial=True)
                if existing
                else ChampFicheSerializer(data=item)
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            saved.append(serializer.data)

        return Response(saved, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="report", permission_classes=[])
    def report(self, request, pk=None):
        """GET /api/v1/fiches/{id}/report/?token=<jwt> — rendu HTML de la fiche."""
        # Support token-in-query-param so the browser can open the URL directly
        token = request.query_params.get("token")
        if token:
            try:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                jwt_auth = JWTAuthentication()
                validated = jwt_auth.get_validated_token(token)
                request.user = jwt_auth.get_user(validated)
            except Exception:
                return HttpResponse("Token invalide.", status=401, content_type="text/plain")
        if not request.user or not request.user.is_authenticated:
            return HttpResponse("Non authentifié.", status=401, content_type="text/plain")

        version = self.get_object()

        # ── Processus ────────────────────────────────────────────────────────
        try:
            from apps.processus.models import Processus
            proc = Processus.objects.get(pk=version.id_processus)
            proc_nom, proc_code, proc_type = proc.nom, proc.code_process, proc.type_process
        except Exception:
            proc_nom  = f"Processus #{version.id_processus}"
            proc_code = "—"
            proc_type = "—"

        # ── Rédacteur ────────────────────────────────────────────────────────
        try:
            from apps.accounts.models import Utilisateur
            u = Utilisateur.objects.get(pk=version.id_redacteur)
            redacteur_nom = f"{u.prenom} {u.nom}"
        except Exception:
            redacteur_nom = "—"

        # ── Champs remplis ───────────────────────────────────────────────────
        champs = list(ChampFiche.objects.filter(id_version=version.pk).order_by("ordre"))

        # ── Sections ordonnées ───────────────────────────────────────────────
        sections_qs = list(SectionTemplate.objects.filter(est_actif=True).order_by("ordre"))
        champ_to_sec = {}
        for sec in sections_qs:
            for ct in ChampTemplate.objects.filter(id_section_template=sec.pk, est_actif=True):
                champ_to_sec[ct.pk] = sec

        # Group by section, preserving section ordre
        from collections import OrderedDict
        sections_data = OrderedDict()
        for sec in sections_qs:
            sections_data[sec.pk] = {"nom": sec.nom, "champs": []}

        orphans = []
        for champ in champs:
            sec = champ_to_sec.get(champ.id_champ_template)
            if sec and sec.pk in sections_data:
                sections_data[sec.pk]["champs"].append(champ)
            else:
                orphans.append(champ)

        # ── Value formatter ──────────────────────────────────────────────────
        def fmt(champ):
            val = champ.valeur_json if champ.valeur_json is not None else champ.valeur
            if val is None or val == "":
                return "<em style='color:#9ca3af'>—</em>"
            if isinstance(val, bool):
                return "Oui" if val else "Non"
            if isinstance(val, list):
                if val and isinstance(val[0], dict):
                    # Tableau : render mini-table
                    headers = list(val[0].keys())
                    th = "".join(f"<th>{h}</th>" for h in headers)
                    rows = "".join(
                        "<tr>" + "".join(f"<td>{row.get(h, '')}</td>" for h in headers) + "</tr>"
                        for row in val
                    )
                    return f"<table class='inner'><thead><tr>{th}</tr></thead><tbody>{rows}</tbody></table>"
                return "<br>".join(f"&bull;&nbsp;{item}" for item in val)
            return str(val)

        # ── Build section HTML ───────────────────────────────────────────────
        def section_html(nom, champs_list):
            if not champs_list:
                return ""
            rows = "".join(
                f"<tr><td class='lbl'>{c.libelle}</td><td>{fmt(c)}</td></tr>"
                for c in champs_list
            )
            return f"<h2>{nom}</h2><table><tbody>{rows}</tbody></table>"

        body_parts = [
            section_html(sd["nom"], sd["champs"])
            for sd in sections_data.values()
            if sd["champs"]
        ]
        if orphans:
            body_parts.append(section_html("Autres champs", orphans))
        body_html = "\n".join(body_parts) or "<p>Aucun champ renseigné.</p>"

        # ── Metadata ─────────────────────────────────────────────────────────
        date_str = version.date_creation.strftime("%d/%m/%Y") if version.date_creation else "—"
        statut_labels = {
            "Brouillon": ("Brouillon", "badge-brouillon"),
            "Soumise":   ("Soumise",   "badge-soumise"),
            "En_revision": ("En révision", "badge-revision"),
            "Publiee":   ("Publiée",   "badge-publiee"),
            "Archivee":  ("Archivée",  "badge-archivee"),
        }
        s_label, s_class = statut_labels.get(version.statut, (version.statut, "badge-brouillon"))
        filename = f"fiche_{proc_code}_v{version.numero_version}.html"

        pdf_filename = f"fiche_{proc_code}_v{version.numero_version}.pdf"

        html = f"""<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Fiche {proc_code} — v{version.numero_version}</title>
  <style>
    *{{box-sizing:border-box}}
    body{{font-family:Arial,sans-serif;color:#1f2937;margin:0;padding:0}}
    #toolbar{{position:fixed;top:0;left:0;right:0;z-index:999;
              display:flex;align-items:center;gap:12px;
              background:#1e1b4b;padding:10px 24px;box-shadow:0 2px 8px rgba(0,0,0,.3)}}
    #toolbar span{{color:#c4b5fd;font-size:13px;font-weight:600;flex:1;
                   white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
    #toolbar button{{background:#7c3aed;color:#fff;border:none;border-radius:6px;
                     padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;
                     display:flex;align-items:center;gap:6px}}
    #toolbar button:hover{{background:#6d28d9}}
    #content{{margin-top:56px;padding:32px;max-width:960px;margin-left:auto;margin-right:auto}}
    header{{background:#f3f0ff;border-left:5px solid #58148e;padding:16px 20px;
            margin-bottom:28px;border-radius:4px}}
    header h1{{margin:0 0 8px;color:#58148e;font-size:20px}}
    .meta{{display:flex;flex-wrap:wrap;gap:20px;font-size:12px;color:#555}}
    .meta span{{white-space:nowrap}} .meta strong{{color:#1f2937}}
    h2{{margin:28px 0 6px;font-size:14px;color:#58148e;
        border-bottom:2px solid #e9d5ff;padding-bottom:4px}}
    table{{width:100%;border-collapse:collapse;margin-top:4px;font-size:13px}}
    td{{border:1px solid #e5e7eb;padding:9px 12px;vertical-align:top}}
    td.lbl{{width:35%;font-weight:600;color:#374151;background:#fafafa}}
    table.inner{{width:100%;border-collapse:collapse;font-size:12px}}
    table.inner th{{background:#ede9fe;color:#4c1d95;padding:5px 8px;
                    border:1px solid #ddd;text-align:left}}
    table.inner td{{padding:5px 8px;border:1px solid #ddd}}
    .badge{{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}}
    .badge-brouillon{{background:#f1f5f9;color:#64748b}}
    .badge-soumise{{background:#fef3c7;color:#92400e}}
    .badge-revision{{background:#dbeafe;color:#1d4ed8}}
    .badge-publiee{{background:#d1fae5;color:#065f46}}
    .badge-archivee{{background:#f3f4f6;color:#6b7280}}
    @media print{{
      #toolbar{{display:none!important}}
      #content{{margin-top:0;padding:20px}}
      body{{margin:0}}
      header{{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}}
      .badge{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      td.lbl{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      h2{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      @page{{margin:15mm 12mm;size:A4}}
    }}
  </style>
</head>
<body>
  <div id="toolbar">
    <span>&#128196;&nbsp; Fiche {proc_code} &mdash; Version {version.numero_version}</span>
    <button onclick="window.print()">
      &#8595;&nbsp; Enregistrer en PDF
    </button>
  </div>
  <div id="content">
    <header>
      <h1>Fiche Processus &mdash; {proc_nom}</h1>
      <div class="meta">
        <span><strong>Code :</strong> {proc_code}</span>
        <span><strong>Type :</strong> {proc_type}</span>
        <span><strong>Version :</strong> {version.numero_version}</span>
        <span><strong>Statut :</strong> <span class="badge {s_class}">{s_label}</span></span>
        <span><strong>Rédacteur :</strong> {redacteur_nom}</span>
        <span><strong>Date :</strong> {date_str}</span>
      </div>
    </header>
    {body_html}
  </div>
  <script>
    // Auto-open print dialog so the user can immediately save as PDF
    window.addEventListener('load', function() {{
      setTimeout(function() {{ window.print(); }}, 400);
    }});
  </script>
</body>
</html>"""

        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response["Content-Disposition"] = f'inline; filename="{pdf_filename}"'
        return response
