import mimetypes
import os
import re
import uuid
import requests
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import (
    DocumentSerializer,
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentUploadSerializer,
)

# ── Constants ─────────────────────────────────────────────────────────────────
ALLOWED_MIME = {
    "image/png", "image/jpeg", "image/svg+xml", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

# Support documents remain permission-restricted, but new uploads are stored in
# shared object storage so every user can download them from any machine.
LOCAL_TYPES = {"Support"}


# ── Helpers — Supabase Storage ────────────────────────────────────────────────

def _storage_headers():
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    return {
        "apikey":        key,
        "Authorization": f"Bearer {key}",
    }


def _safe_filename(name: str) -> str:
    import unicodedata
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^a-zA-Z0-9.\-_]", "_", name)
    return name[:200]


def _upload(storage_path: str, file_bytes: bytes, mime: str):
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
    headers = {**_storage_headers(), "Content-Type": mime}
    r = requests.post(url, data=file_bytes, headers=headers)
    r.raise_for_status()


def _signed_url(storage_path: str, expires_in: int = 3600) -> str:
    url = (
        f"{settings.SUPABASE_URL}/storage/v1/object/sign"
        f"/{settings.SUPABASE_STORAGE_BUCKET}/{storage_path}"
    )
    r = requests.post(url, json={"expiresIn": expires_in}, headers=_storage_headers())
    r.raise_for_status()
    signed = r.json().get("signedURL", "")
    return f"{settings.SUPABASE_URL}/storage/v1{signed}" if signed else ""


def _delete_supabase(storage_path: str):
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}"
    r = requests.delete(url, json={"prefixes": [storage_path]}, headers=_storage_headers())
    r.raise_for_status()


def _serialize_with_urls(docs):
    urls = {}
    for doc in docs:
        try:
            urls[doc.id_document] = _signed_url(doc.chemin_stockage)
        except Exception:
            urls[doc.id_document] = ""
    return DocumentSerializer(docs, many=True, context={"urls": urls}).data


def _normalize_local_storage_path(storage_path: str) -> str:
    normalized = str(storage_path or "").replace("\\", "/").strip()
    return normalized.lstrip("/")


def _local_abs_path(storage_path: str) -> str:
    relative_path = _normalize_local_storage_path(storage_path)
    return os.path.join(settings.MEDIA_ROOT, *relative_path.split("/"))


def _is_legacy_local_support_doc(doc) -> bool:
    if getattr(doc, "type_document", None) != "Support":
        return False

    relative_path = _normalize_local_storage_path(getattr(doc, "chemin_stockage", ""))
    if not relative_path:
        return False

    if relative_path.startswith("documents/"):
        return True

    return os.path.exists(_local_abs_path(relative_path))


# ── Helpers — permissions ─────────────────────────────────────────────────────

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
    except Exception:
        return False


# ── Pagination ────────────────────────────────────────────────────────────────

class DocumentPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response({
            "results": data,
            "pagination": {
                "page":        self.page.number,
                "page_size":   self.page.paginator.per_page,
                "total_items": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
            },
        })


# ── Views ─────────────────────────────────────────────────────────────────────

class DocumentListView(APIView):
    """
    GET /api/v1/documents/?id_version=X
    Returns fiche documents (BPMN, Preuve, etc.) with Supabase signed URLs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_version = request.query_params.get("id_version")
        if not id_version:
            return Response({"detail": "id_version requis."}, status=status.HTTP_400_BAD_REQUEST)
        docs = Document.objects.filter(id_version=id_version)
        return Response(_serialize_with_urls(docs))


class DocumentUploadView(APIView):
    """
    POST /api/v1/documents/upload/
    Uploads a fiche document (BPMN, Preuve, Rapport_audit_fiche) to Supabase Storage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file           = request.FILES.get("file")
        id_version     = request.data.get("id_version")
        type_document  = request.data.get("type_document", "Preuve")
        description    = request.data.get("description", "")
        evaluation     = request.data.get("evaluation") or None
        id_audit_field = request.data.get("id_audit_field") or None

        allowed_types = {c[0] for c in Document.TYPE_CHOICES}
        if type_document not in allowed_types:
            return Response(
                {"detail": f"type_document invalide. Valeurs acceptées : {', '.join(sorted(allowed_types))}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file:
            return Response({"detail": "Fichier manquant."}, status=status.HTTP_400_BAD_REQUEST)
        if not id_version:
            return Response({"detail": "id_version manquant."}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_SIZE_BYTES:
            return Response(
                {"detail": "Fichier trop volumineux. Maximum autorisé : 20 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mime = file.content_type or mimetypes.guess_type(file.name)[0] or "application/octet-stream"
        if mime not in ALLOWED_MIME:
            return Response(
                {"detail": "Type de fichier non autorisé (PNG, SVG, JPG, PDF, Word uniquement)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        safe_name    = _safe_filename(file.name)
        storage_path = f"{id_version}/{type_document}/{safe_name}"

        try:
            _upload(storage_path, file.read(), mime)
        except requests.HTTPError as e:
            body = e.response.text if e.response is not None else str(e)
            return Response(
                {"detail": f"Supabase Storage error: {e.response.status_code if e.response is not None else '?'} — {body}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            return Response({"detail": f"Erreur lors de l'upload : {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        try:
            uploader_id = int(request.data.get("id_uploader") or request.user.utilisateur.id_user)
        except Exception:
            return Response({"detail": "Impossible de résoudre l'identifiant utilisateur."}, status=status.HTTP_400_BAD_REQUEST)

        doc = Document.objects.create(
            id_version      = int(id_version),
            id_uploader     = uploader_id,
            nom_fichier     = safe_name,
            type_document   = type_document,
            chemin_stockage = storage_path,
            taille          = file.size,
            description     = description,
            evaluation      = evaluation,
            id_audit_field  = int(id_audit_field) if id_audit_field else None,
        )

        try:
            url = _signed_url(storage_path)
        except Exception:
            url = ""

        data = DocumentSerializer(doc, context={"urls": {doc.id_document: url}}).data
        return Response(data, status=status.HTTP_201_CREATED)


class DocumentListCreateView(APIView):
    """
    GET  /api/v1/documents/support/   — paginated Support document list
    POST /api/v1/documents/support/   — upload Support document (CAQ only, shared storage)
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Document.objects.filter(type_document="Support").order_by("-date_upload")

        search       = request.query_params.get("search", "").strip()
        type_support = request.query_params.get("type_support", "").strip()

        if search:
            qs = qs.filter(
                Q(nom_fichier__icontains=search) | Q(description__icontains=search)
            )
        if type_support:
            qs = qs.filter(type_support=type_support)

        paginator = DocumentPagination()
        page      = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(DocumentListSerializer(page, many=True).data)

    def post(self, request):
        if not _is_caq(request.user):
            raise PermissionDenied("Seuls les membres CAQ peuvent importer des documents.")

        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        fichier = data.pop("fichier")
        safe_name = _safe_filename(fichier.name or data.get("nom_fichier") or "support")
        storage_path = f"support/{uuid.uuid4().hex}_{safe_name}"
        mime = (
            fichier.content_type
            or mimetypes.guess_type(fichier.name)[0]
            or "application/octet-stream"
        )

        try:
            _upload(storage_path, fichier.read(), mime)
        except requests.HTTPError as e:
            body = e.response.text if e.response is not None else str(e)
            return Response(
                {"detail": f"Supabase Storage error: {e.response.status_code if e.response is not None else '?'} — {body}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as e:
            return Response(
                {"detail": f"Erreur lors de l'upload : {e}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            from apps.accounts.models import Utilisateur
            uploader_id = Utilisateur.objects.get(email=request.user.email).id_user
        except Exception:
            uploader_id = request.user.pk

        doc = Document.objects.create(
            **data,
            type_document   = "Support",
            id_uploader     = uploader_id,
            chemin_stockage = storage_path,
            taille          = fichier.size,
            date_upload     = timezone.now(),
        )
        return Response(DocumentDetailSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """
    GET    /api/v1/documents/<id>/  — document detail
    DELETE /api/v1/documents/<id>/  — delete (Supabase for fiche docs, local for Support)
    """
    permission_classes = [IsAuthenticated]

    def _get_doc(self, pk):
        try:
            return Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return None

    def get(self, request, pk):
        doc = self._get_doc(pk)
        if doc is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if doc.type_document in LOCAL_TYPES:
            return Response(DocumentDetailSerializer(doc).data)
        urls = {}
        try:
            urls[doc.id_document] = _signed_url(doc.chemin_stockage)
        except Exception:
            urls[doc.id_document] = ""
        return Response(DocumentSerializer(doc, context={"urls": urls}).data)

    def delete(self, request, pk):
        doc = self._get_doc(pk)
        if doc is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if doc.type_document in LOCAL_TYPES:
            if not _is_caq(request.user):
                raise PermissionDenied("Seuls les membres CAQ peuvent supprimer des documents Support.")

        if doc.type_document in LOCAL_TYPES and _is_legacy_local_support_doc(doc):
            file_path = _local_abs_path(doc.chemin_stockage)
            if os.path.exists(file_path):
                os.remove(file_path)
        else:
            try:
                _delete_supabase(doc.chemin_stockage)
            except Exception:
                pass  # still delete the DB record

        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadView(APIView):
    """GET /api/v1/documents/<id>/download/ — returns download URL for Support docs."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if doc.type_document not in LOCAL_TYPES:
            try:
                url = _signed_url(doc.chemin_stockage)
            except Exception:
                url = ""
        else:
            if _is_legacy_local_support_doc(doc):
                relative_path = _normalize_local_storage_path(doc.chemin_stockage)
                file_path = _local_abs_path(doc.chemin_stockage)
                if not os.path.exists(file_path):
                    return Response(
                        {"detail": "Fichier introuvable sur le serveur. Reimportez le document."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
                url = request.build_absolute_uri(settings.MEDIA_URL + relative_path)
            else:
                try:
                    url = _signed_url(doc.chemin_stockage)
                except Exception:
                    return Response(
                        {"detail": "Fichier introuvable sur le serveur. Reimportez le document."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        return Response({"url": url, "nom_fichier": doc.nom_fichier})
