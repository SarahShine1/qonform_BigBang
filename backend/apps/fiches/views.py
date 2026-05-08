from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SectionTemplate, ChampTemplate, VersionFiche, ChampFiche
from .serializers import (
    SectionTemplateSerializer,
    ChampTemplateSerializer,
    VersionFicheSerializer,
    ChampFicheSerializer,
)


class SectionTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/fiches/template/sections/                – liste des sections
    GET /api/v1/fiches/template/sections/{id}/champs/    – champs d'une section
    """

    serializer_class = SectionTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SectionTemplate.objects.filter(est_actif=True).order_by("ordre")

    @action(detail=True, methods=["get"], url_path="champs")
    def champs(self, request, pk=None):
        section = self.get_object()
        champs = ChampTemplate.objects.filter(
            id_section_template=section.pk, est_actif=True
        ).order_by("ordre")
        return Response(ChampTemplateSerializer(champs, many=True).data)


class VersionFicheViewSet(viewsets.ModelViewSet):
    """
    POST /api/v1/fiches/                   – créer une fiche
    GET  /api/v1/fiches/{id}/              – détail d'une fiche
    GET  /api/v1/fiches/{id}/champs/       – lire les champs remplis
    POST /api/v1/fiches/{id}/champs/       – sauvegarder les champs (bulk upsert)
    """

    serializer_class = VersionFicheSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VersionFiche.objects.all()

    def perform_create(self, serializer):
        try:
            id_redacteur = self.request.user.utilisateur.id_user
        except Exception:
            id_redacteur = self.request.data.get("id_redacteur")
        serializer.save(id_redacteur=id_redacteur)

    @action(detail=True, methods=["get", "post"], url_path="champs")
    def champs(self, request, pk=None):
        version = self.get_object()

        if request.method == "GET":
            champs = ChampFiche.objects.filter(id_version=version.pk).order_by("ordre")
            return Response(ChampFicheSerializer(champs, many=True).data)

        # POST — bulk upsert
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
