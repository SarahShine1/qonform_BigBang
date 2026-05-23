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


def notifier_audit_fiche(fiche, type_notification, titre, message):
    destinataire_ids = []
    for key in ("id_redacteur", "id_pilote"):
        destinataire_id = fiche.get(key)
        if destinataire_id and destinataire_id not in destinataire_ids:
            destinataire_ids.append(destinataire_id)

    code_fiche = fiche.get("code_fiche") or fiche.get("code_process") or f"#{fiche.get('id_version')}"
    id_processus = fiche.get("id_processus")

    if not destinataire_ids:
        return []

    lien = f"/gestion-processus/dossier/{id_processus}" if id_processus else "/dashboard-pilote"

    created_notifications = []
    for destinataire_id in destinataire_ids:
        notification, _ = Notification.objects.get_or_create(
            destinataire_id=destinataire_id,
            type_notification=type_notification,
            lien=lien,
            defaults={
                "titre": titre,
                "message": message.format(code_fiche=code_fiche),
            },
        )
        created_notifications.append(notification)
    return created_notifications


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
