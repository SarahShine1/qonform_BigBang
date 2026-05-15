from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import TachePlanifiee
from .serializers import TachePlanifieeSerializer
from apps.notifications.models import Notification

class TachePlanifieeViewSet(viewsets.ModelViewSet):
    queryset = TachePlanifiee.objects.all()
    serializer_class = TachePlanifieeSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        tache = serializer.save()

        if tache.responsable:
            Notification.objects.create(
                destinataire=tache.responsable,
                type_notification="TACHE_AFFECTEE",
                titre="Nouvelle tâche affectée",
                message=f"Une nouvelle tâche vous a été affectée : {tache.intitule}",
                lien="/planification",
            )

    def perform_update(self, serializer):
        ancienne_tache = self.get_object()
        ancien_statut = ancienne_tache.statut

        tache = serializer.save()

        if ancien_statut != tache.statut:
            if tache.statut == "En cours":
                Notification.objects.create(
                    destinataire=tache.createur,
                    type_notification="TACHE_DEMARREE",
                    titre="Tâche démarrée",
                    message=f"La tâche '{tache.intitule}' est maintenant en cours.",
                    lien="/planification",
                )

            elif tache.statut == "Terminée":
                Notification.objects.create(
                    destinataire=tache.createur,
                    type_notification="TACHE_TERMINEE",
                    titre="Tâche terminée",
                    message=f"La tâche '{tache.intitule}' a été terminée.",
                    lien="/planification",
                )

            elif tache.statut == "Annulée":
                Notification.objects.create(
                    destinataire=tache.createur,
                    type_notification="TACHE_ANNULEE",
                    titre="Tâche annulée",
                    message=f"La tâche '{tache.intitule}' a été annulée.",
                    lien="/planification",
                )
        else:
            Notification.objects.create(
                destinataire=tache.responsable,
                type_notification="TACHE_MODIFIEE",
                titre="Tâche modifiée",
                message=f"La tâche '{tache.intitule}' a été modifiée.",
                lien="/planification",
            )