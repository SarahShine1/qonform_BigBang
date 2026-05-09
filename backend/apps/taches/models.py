from django.db import models


class TachePlanifiee(models.Model):
    TYPE_CHOICES = [
        ("Audit", "Audit"),
        ("Documentation", "Documentation"),
        ("Validation", "Validation"),
        ("Correction", "Correction"),
        ("Réunion", "Réunion"),
        ("Formation", "Formation"),
        ("Autre", "Autre"),
    ]

    PRIORITE_CHOICES = [
        ("Haute", "Haute"),
        ("Moyenne", "Moyenne"),
        ("Basse", "Basse"),
    ]

    STATUT_CHOICES = [
        ("Planifiée", "Planifiée"),
        ("En cours", "En cours"),
        ("Terminée", "Terminée"),
        ("Annulée", "Annulée"),
    ]

    id_tache = models.AutoField(primary_key=True, db_column="id_tache")

    intitule = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    type_tache = models.CharField(max_length=50, choices=TYPE_CHOICES)

    responsable = models.ForeignKey(
        "accounts.Utilisateur",
        on_delete=models.DO_NOTHING,
        db_column="id_responsable",
        related_name="taches_assignees",
    )

    createur = models.ForeignKey(
        "accounts.Utilisateur",
        on_delete=models.DO_NOTHING,
        db_column="id_createur",
        related_name="taches_creees",
    )

    date_debut = models.DateField()
    date_fin = models.DateField()

    priorite = models.CharField(
        max_length=20,
        choices=PRIORITE_CHOICES,
        default="Moyenne",
    )

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="Planifiée",
    )

    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "tache_planifiee"
        ordering = ["-created_at"]

    def __str__(self):
        return self.intitule