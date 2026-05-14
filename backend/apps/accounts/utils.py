from datetime import date

from django.conf import settings
from django.core.mail import send_mail
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
