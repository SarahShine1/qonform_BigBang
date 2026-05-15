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