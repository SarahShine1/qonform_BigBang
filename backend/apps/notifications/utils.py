from .models import Notification


def notifier_auditeurs_soumission(version_fiche):
    """
    Crée une notification SOUMISSION_FICHE pour chaque auditeur actif
    lorsqu'une version de fiche passe au statut 'Soumise'.
    """
    from apps.accounts.models import Utilisateur, UserRole

    auditeur_ids = UserRole.objects.filter(
        role__libelle__iexact="Auditeur",
    ).values_list("utilisateur_id", flat=True)
    auditeurs = Utilisateur.objects.filter(id_user__in=auditeur_ids, est_actif=True)

    try:
        from apps.processus.models import Processus
        proc = Processus.objects.get(pk=version_fiche.id_processus)
        proc_nom = proc.nom
    except Exception:
        proc_nom = f"Processus #{version_fiche.id_processus}"

    for auditeur in auditeurs:
        Notification.objects.create(
            destinataire=auditeur,
            type_notification="SOUMISSION_FICHE",
            titre="Nouvelle fiche soumise",
            message=(
                f"La version {version_fiche.numero_version} de la fiche "
                f"« {proc_nom} » a été soumise et est en attente de revue."
            ),
            lien=f"/auditeur/execution-audit/{version_fiche.id_version}",
        )


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