from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

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
        section = self.get_object()
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
        instance = serializer.save(id_redacteur=id_redacteur)
        _sync_liaisons(
            instance.id_processus,
            self._get_liaison_ids("amont_ids"),
            self._get_liaison_ids("aval_ids"),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        _sync_liaisons(
            instance.id_processus,
            self._get_liaison_ids("amont_ids"),
            self._get_liaison_ids("aval_ids"),
        )

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
