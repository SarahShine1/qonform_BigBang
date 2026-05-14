from datetime import date
import mimetypes
import os
import re
import uuid

from django.conf import settings
from django.core.mail import send_mail
import requests
from django.conf import settings
from django.db import connection

from .models import Role, User


def split_full_name(full_name):
    chunks = [part for part in str(full_name or "").strip().split() if part]
    if not chunks:
        return "", ""
    if len(chunks) == 1:
        return chunks[0], chunks[0]
    return chunks[-1], " ".join(chunks[:-1])


def normalize_role_names(role_names):
    cleaned = []
    seen = set()
    for role_name in role_names or []:
        label = " ".join(str(role_name or "").strip().split())
        if not label:
            continue
        key = label.upper()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(label)
    return cleaned


def get_active_role_labels_for_user(user_id):
    today = date.today()
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT r.libelle
            FROM user_role ur
            INNER JOIN role r ON r.id_role = ur.id_role
            WHERE ur.id_user = %s
              AND (ur.date_expiration IS NULL OR ur.date_expiration > %s)
            ORDER BY r.libelle ASC
            """,
            [user_id, today],
        )
        return [row[0] for row in cursor.fetchall()]


def sync_roles_for_user(user_id, role_names):
    normalized_roles = normalize_role_names(role_names)
    role_ids = []

    for role_name in normalized_roles:
        role, _ = Role.objects.get_or_create(libelle=role_name)
        role_ids.append(role.id_role)

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_role WHERE id_user = %s", [user_id])
        for role_id in role_ids:
            cursor.execute(
                """
                INSERT INTO user_role (id_user, id_role, date_expiration)
                VALUES (%s, %s, NULL)
                """,
                [user_id, role_id],
            )


def get_auth_user_for_utilisateur(utilisateur):
    if not utilisateur:
        return None

    try:
        auth_user = getattr(utilisateur, "auth", None)
    except Exception:
        auth_user = None

    if auth_user:
        return auth_user

    email = str(getattr(utilisateur, "email", "") or "").strip()
    if not email:
        return None

    return User.objects.filter(email__iexact=email).first()


def send_user_invitation_email(utilisateur, temporary_password):
    """
    Send the initial account credentials to a newly created user.

    The message intentionally avoids localhost links because Qonform is not
    deployed yet and local URLs would only work on the developer machine.
    """

    prenom = str(getattr(utilisateur, "prenom", "") or "").strip() or "Utilisateur"
    email = str(getattr(utilisateur, "email", "") or "").strip()

    subject = "Votre compte Qonform a été créé"
    body = (
        f"Bonjour {prenom},\n\n"
        "Votre compte Qonform a été créé.\n\n"
        f"Email : {email}\n"
        f"Mot de passe temporaire : {temporary_password}\n\n"
        "Veuillez vous connecter à la plateforme Qonform lorsque l’accès "
        "vous sera communiqué, puis changer votre mot de passe.\n\n"
        "Cordialement,\n"
        "L’équipe Qonform"
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
def _profile_bucket():
    return (
        getattr(settings, "SUPABASE_PROFILE_BUCKET", "")
        or getattr(settings, "SUPABASE_STORAGE_BUCKET", "")
    )


def profile_storage_is_configured():
    return bool(
        getattr(settings, "SUPABASE_URL", "")
        and getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        and _profile_bucket()
    )


def _storage_headers():
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
    }


def safe_storage_filename(name: str) -> str:
    import unicodedata

    normalized = unicodedata.normalize("NFKD", str(name or "")).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9.\-_]", "_", normalized)
    return normalized[:200] or "profile"


def upload_profile_photo_to_storage(file_obj, utilisateur_id: int) -> str:
    extension = os.path.splitext(file_obj.name or "")[1].lower() or ".bin"
    safe_name = safe_storage_filename(os.path.splitext(file_obj.name or "profile")[0])
    storage_path = f"profiles/{utilisateur_id}/{uuid.uuid4().hex}_{safe_name}{extension}"
    mime = getattr(file_obj, "content_type", None) or mimetypes.guess_type(file_obj.name or "")[0] or "application/octet-stream"

    file_obj.seek(0)
    file_bytes = file_obj.read()

    url = (
        f"{settings.SUPABASE_URL}/storage/v1/object/"
        f"{_profile_bucket()}/{storage_path}"
    )
    response = requests.post(
        url,
        data=file_bytes,
        headers={**_storage_headers(), "Content-Type": mime},
    )
    response.raise_for_status()
    file_obj.seek(0)
    return storage_path


def _looks_like_shared_profile_path(stored_name: str) -> bool:
    normalized = str(stored_name or "").replace("\\", "/").strip().lstrip("/")
    return bool(re.match(r"^profiles/\d+/.+", normalized))


def get_profile_photo_url(photo_field, request=None, expires_in: int = 3600):
    if not photo_field:
        return None

    stored_name = str(getattr(photo_field, "name", "") or "").strip()
    if not stored_name:
        return None

    local_path = ""
    try:
        local_path = photo_field.path
    except Exception:
        local_path = ""

    if local_path and os.path.exists(local_path):
        try:
            local_url = photo_field.url
        except Exception:
            local_url = ""
        if local_url:
            return request.build_absolute_uri(local_url) if request else local_url

    if profile_storage_is_configured() and _looks_like_shared_profile_path(stored_name):
        try:
            sign_url = (
                f"{settings.SUPABASE_URL}/storage/v1/object/sign/"
                f"{_profile_bucket()}/{stored_name}"
            )
            response = requests.post(
                sign_url,
                json={"expiresIn": expires_in},
                headers=_storage_headers(),
                timeout=10,
            )
            response.raise_for_status()
            signed = response.json().get("signedURL", "")
            if signed:
                return f"{settings.SUPABASE_URL}/storage/v1{signed}"
        except requests.RequestException:
            pass

    try:
        fallback_url = photo_field.url
    except Exception:
        fallback_url = ""

    if fallback_url:
        return request.build_absolute_uri(fallback_url) if request else fallback_url

    return None


def delete_profile_photo_from_storage(stored_name: str):
    if not stored_name or not profile_storage_is_configured():
        return

    url = f"{settings.SUPABASE_URL}/storage/v1/object/{_profile_bucket()}"
    response = requests.delete(
        url,
        json={"prefixes": [stored_name]},
        headers=_storage_headers(),
    )
    response.raise_for_status()
