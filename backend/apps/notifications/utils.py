from .models import Notification


def notifier_participants_pv(pv):
    """
    Envoie une notification à chaque participant d'un PV nouvellement créé.
    pv.participants est un M2M vers User (auth), donc on remonte vers Utilisateur via auth_id.
    """
    from apps.accounts.models import Utilisateur

    type_label = dict(pv.PV_TYPES).get(pv.type, pv.type)
    date_formatee = pv.date.strftime('%d/%m/%Y')

    for user in pv.participants.all():
        profil = Utilisateur.objects.filter(auth_id=user.id).first()

        if not profil:
            continue

        Notification.objects.create(
            destinataire=profil,
            type_notification="PV_CREE",
            titre=f"Nouveau PV : {pv.code}",
            message=(
                f"Vous êtes inscrit comme participant au procès-verbal "
                f"« {type_label} » du {date_formatee} ."
            ),
            lien="/suivi",
        )


def notifier_audit_fiche(fiche, type_notification, titre, message):
    destinataire_id = fiche.get("id_redacteur")
    code_fiche = fiche.get("code_fiche") or fiche.get("code_process") or f"#{fiche.get('id_version')}"
    id_processus = fiche.get("id_processus")

    if not destinataire_id:
        return None

    lien = f"/gestion-processus/dossier/{id_processus}" if id_processus else "/dashboard-pilote"

    return Notification.objects.create(
        destinataire_id=destinataire_id,
        type_notification=type_notification,
        titre=titre,
        message=message.format(code_fiche=code_fiche),
        lien=lien,
    )


def notifier_fiche_en_cours_audit(fiche):
    return notifier_audit_fiche(
        fiche,
        "AUDIT_FICHE_EN_COURS",
        "Fiche en cours d'audit",
        "La fiche {code_fiche} est en cours d'audit.",
    )


def notifier_fiche_correction_demandee(fiche):
    return notifier_audit_fiche(
        fiche,
        "AUDIT_CORRECTION_DEMANDEE",
        "Correction demandée",
        "La fiche {code_fiche} vous a été renvoyée pour correction.",
    )


def notifier_fiche_publiee(fiche):
    return notifier_audit_fiche(
        fiche,
        "AUDIT_FICHE_PUBLIEE",
        "Fiche publiée",
        "La fiche {code_fiche} a été auditée et publiée.",
    )
