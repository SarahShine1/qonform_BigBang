from django.db import models
from apps.accounts.models import Utilisateur


class Notification(models.Model):
    TYPE_CHOICES = [
        ("TACHE_AFFECTEE", "Tâche affectée"),
        ("TACHE_MODIFIEE", "Tâche modifiée"),
        ("TACHE_DEMARREE", "Tâche démarrée"),
        ("TACHE_TERMINEE", "Tâche terminée"),
        ("TACHE_ANNULEE", "Tâche annulée"),
        ("TACHE_RETARD", "Tâche en retard"),
    ]

    id_notification = models.AutoField(primary_key=True)
    destinataire = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        db_column="id_destinataire",
        related_name="notifications",
    )
    type_notification = models.CharField(max_length=50, choices=TYPE_CHOICES)
    titre = models.CharField(max_length=200)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    lien = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification"
        ordering = ["-created_at"]