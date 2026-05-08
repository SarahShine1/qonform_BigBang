# backend/apps/documents/views.py

import os
from django.http import FileResponse
from rest_framework import generics, permissions, filters, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import DocumentSerializer, DocumentUploadSerializer


# ─── Permission personnalisée ────────────────────────────────────────────────

class IsChefProjet(permissions.BasePermission):
    """
    Autorise uniquement les utilisateurs dont le champ `role` vaut 'chef_projet'.
    Tous les autres utilisateurs authentifiés peuvent lire mais pas écrire.
    """
    message = "Seuls les chefs de projet peuvent uploader des documents."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'chef_projet'
        )

# ─── Vues ────────────────────────────────────────────────────────────────────

class DocumentListView(generics.ListAPIView):
    """
    GET /api/documents/
    Retourne la liste de tous les documents.
    Supporte la recherche par titre via ?search=...
    Accessible à tous les utilisateurs authentifiés.
    """
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['titre']

    def get_queryset(self):
        return Document.objects.select_related('publie_par').all()


class DocumentUploadView(generics.CreateAPIView):
    """
    POST /api/documents/upload/
    Upload un nouveau document PDF.
    Réservé aux chefs de projet uniquement.
    """
    serializer_class = DocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated, IsChefProjet]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        serializer.save(publie_par=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Retourner le document complet avec publie_par_nom et date_publication
        doc = Document.objects.select_related('publie_par').get(pk=serializer.instance.pk)
        return Response(
            DocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED
        )


class DocumentDownloadView(APIView):
    """
    GET /api/documents/<id>/download/
    Télécharge le fichier PDF du document.
    Accessible à tous les utilisateurs authentifiés.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            document = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response(
                {'detail': 'Document non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        file_path = document.fichier.path
        if not os.path.exists(file_path):
            return Response(
                {'detail': 'Fichier introuvable sur le serveur.'},
                status=status.HTTP_404_NOT_FOUND
            )

        response = FileResponse(
            open(file_path, 'rb'),
            content_type='application/pdf'
        )
        filename = os.path.basename(file_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class DocumentDetailView(generics.RetrieveAPIView):
    """
    GET /api/documents/<id>/
    Retourne le détail d'un document.
    Accessible à tous les utilisateurs authentifiés.
    """
    queryset = Document.objects.select_related('publie_par').all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]