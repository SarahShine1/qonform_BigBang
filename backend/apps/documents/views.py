import mimetypes
import re
import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Document
from .serializers import DocumentSerializer

# ── Accepted MIME types ───────────────────────────────────────────────────────
ALLOWED_MIME = {
    "image/png", "image/jpeg", "image/svg+xml", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


# ── Supabase Storage helpers ──────────────────────────────────────────────────

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


def _delete(storage_path: str):
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


# ── Views ─────────────────────────────────────────────────────────────────────

class DocumentListView(APIView):
    """GET /api/v1/documents/?id_version=X"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_version = request.query_params.get("id_version")
        if not id_version:
            return Response({"detail": "id_version requis."}, status=status.HTTP_400_BAD_REQUEST)
        docs = Document.objects.filter(id_version=id_version)
        return Response(_serialize_with_urls(docs))


class DocumentUploadView(APIView):
    """POST /api/v1/documents/upload/"""
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

        # Size check
        if file.size > MAX_SIZE_BYTES:
            return Response(
                {"detail": f"Fichier trop volumineux. Maximum autorisé : 20 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # MIME check
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
            return Response({"detail": f"Supabase Storage error: {e.response.status_code if e.response is not None else '?'} — {body}"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({"detail": f"Erreur lors de l'upload : {e}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Resolve uploader id — prefer value sent by frontend
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


class DocumentDeleteView(APIView):
    """DELETE /api/v1/documents/{id}/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            _delete(doc.chemin_stockage)
        except Exception:
            pass  # Still delete DB record even if storage fails

        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
