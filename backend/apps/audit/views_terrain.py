import os
import uuid

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Departement, Utilisateur
from apps.documents.models import Document
from .models_terrain import AuditTerrain
from .serializers_terrain import (
    AuditTerrainCreateSerializer,
    AuditTerrainListSerializer,
    DepartementSerializer,
)


def _get_utilisateur(user):
    return Utilisateur.objects.get(email=user.email)


# ──────────────────────────────────────────────
# Départements (liste pour le select)
# ──────────────────────────────────────────────

class DepartementListView(APIView):
    def get(self, request):
        deps = Departement.objects.all().order_by("nom")
        return Response(DepartementSerializer(deps, many=True).data)


# ──────────────────────────────────────────────
# Audit terrain — liste + création
# ──────────────────────────────────────────────

class AuditTerrainListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        qs = AuditTerrain.objects.select_related(
            "id_auditeur", "id_departement"
        ).order_by("-date_audit")
        return Response(AuditTerrainListSerializer(qs, many=True).data)

    def post(self, request):
        from apps.accounts.models import Utilisateur, UserRole
        utilisateur = _get_utilisateur(request.user)
    
        est_auditeur = UserRole.objects.filter(
        utilisateur=utilisateur,
        role__libelle__in=["Auditeur", "auditeur", "AUDITEUR"],
        ).exists()
        if not est_auditeur:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les auditeurs peuvent créer un audit terrain.")
        serializer = AuditTerrainCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        utilisateur = _get_utilisateur(request.user)

        audit = AuditTerrain.objects.create(
            **serializer.validated_data,
            id_auditeur=utilisateur,
        )

        # Upload du rapport si fourni
        fichier = request.FILES.get("rapport")
        print("FILES reçus:", request.FILES)  # ← ajoute ça
        print("DATA reçus:", request.data)    # ← et ça
        if fichier:
            ext = os.path.splitext(fichier.name)[1]
            unique_name = f"{uuid.uuid4().hex}{ext}"
            upload_dir = os.path.join(settings.MEDIA_ROOT, "documents")
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, unique_name)

            with open(file_path, "wb+") as dest:
                for chunk in fichier.chunks():
                    dest.write(chunk)

            doc = Document.objects.create(
                nom_fichier=request.data.get("nom_rapport") or fichier.name,
                type_document="Rapport",
                type_support=None,
                chemin_stockage=f"documents/{unique_name}",
                taille=fichier.size,
                date_upload=timezone.now(),
                id_uploader=utilisateur.id_user,
                id_audit_field=None,
                description=f"Rapport audit terrain — {audit.date_audit}",
            )
            print("Document créé:", doc.id_document)  # ← et ça
        else:
            print("Aucun fichier reçu !")  # ← crucial

        return Response(
            AuditTerrainListSerializer(
                AuditTerrain.objects.select_related(
                    "id_auditeur", "id_departement"
                ).get(pk=audit.pk)
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ──────────────────────────────────────────────
# Audit terrain — détail + suppression
# ──────────────────────────────────────────────

class AuditTerrainDetailView(APIView):
    def _get(self, pk):
        try:
            return AuditTerrain.objects.select_related(
                "id_auditeur", "id_departement"
            ).get(pk=pk)
        except AuditTerrain.DoesNotExist:
            return None

    def get(self, request, pk):
        audit = self._get(pk)
        if not audit:
            return Response({"detail": "Not found."}, status=404)
        return Response(AuditTerrainListSerializer(audit).data)

    def patch(self, request, pk):
        audit = self._get(pk)
        if not audit:
            return Response({"detail": "Not found."}, status=404)
        serializer = AuditTerrainCreateSerializer(
            audit, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        for attr, value in serializer.validated_data.items():
            setattr(audit, attr, value)
        audit.save()
        return Response(AuditTerrainListSerializer(audit).data)

    def delete(self, request, pk):
        audit = self._get(pk)
        if not audit:
            return Response({"detail": "Not found."}, status=404)
        audit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)