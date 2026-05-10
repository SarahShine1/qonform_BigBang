import os
import uuid
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import (
    DocumentDetailSerializer,
    DocumentListSerializer,
    DocumentUploadSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_caq(user):
    if not user or not user.is_authenticated:
        return False
    try:
        from apps.accounts.models import Utilisateur, UserRole
        utilisateur = Utilisateur.objects.get(email=user.email)
        return UserRole.objects.filter(
            utilisateur=utilisateur,
            role__libelle="CAQ",
        ).exists()
    except Exception as e:
        print(">>> _is_caq ERREUR:", e)
        return False


class DocumentPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response(
            {
                "results": data,
                "pagination": {
                    "page": self.page.number,
                    "page_size": self.page.paginator.per_page,
                    "total_items": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                },
            }
        )


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class DocumentListCreateView(APIView):
    """
    GET  /api/documents/   → liste paginée (type_document=Support uniquement)
    POST /api/documents/   → upload (CAQ seulement)
    """

    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # Uniquement les documents de type Support
        qs = Document.objects.select_related("id_uploader").filter(
            type_document="Support"
        ).order_by("-date_upload")

        # --- Filtres ---
        search = request.query_params.get("search", "").strip()
        type_support = request.query_params.get("type_support", "").strip()

        if search:
            qs = qs.filter(
                Q(nom_fichier__icontains=search)
                | Q(description__icontains=search)
            )

        if type_support:
            qs = qs.filter(type_support=type_support)

        # --- Pagination ---
        paginator = DocumentPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = DocumentListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if not _is_caq(request.user):
            raise PermissionDenied(
                "Seuls les membres CAQ peuvent importer des documents."
            )

        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fichier = serializer.validated_data.pop("fichier")

        # Sauvegarde du fichier sur disque
        ext = os.path.splitext(fichier.name)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, "documents")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)

        with open(file_path, "wb+") as dest:
            for chunk in fichier.chunks():
                dest.write(chunk)

        relative_path = os.path.join("documents", unique_name)

        from apps.accounts.models import Utilisateur
        utilisateur = Utilisateur.objects.get(email=request.user.email)

        doc = Document.objects.create(
            **serializer.validated_data,
            type_document="Support",   # forcé côté serveur
            id_uploader=utilisateur,
            chemin_stockage=relative_path,
            taille=fichier.size,
            date_upload=timezone.now(),
        )

        return Response(
            DocumentDetailSerializer(doc).data, status=status.HTTP_201_CREATED
        )


class DocumentDetailView(APIView):
    """
    GET    /api/documents/<id>/   → détail
    DELETE /api/documents/<id>/   → suppression (CAQ seulement)
    """

    def _get_doc(self, pk):
        try:
            return Document.objects.select_related("id_uploader").get(pk=pk)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self._get_doc(pk)
        if doc is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DocumentDetailSerializer(doc).data)

    def delete(self, request, pk):
        if not _is_caq(request.user):
            raise PermissionDenied(
                "Seuls les membres CAQ peuvent supprimer des documents."
            )

        doc = self._get_doc(pk)
        if doc is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Supprimer le fichier physique
        file_path = os.path.join(settings.MEDIA_ROOT, doc.chemin_stockage)
        if os.path.exists(file_path):
            os.remove(file_path)

        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadView(APIView):
    """
    GET /api/documents/<id>/download/
    Retourne l'URL de téléchargement du fichier.
    """

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        url = request.build_absolute_uri(
            settings.MEDIA_URL + doc.chemin_stockage
        )
        return Response({"url": url, "nom_fichier": doc.nom_fichier})