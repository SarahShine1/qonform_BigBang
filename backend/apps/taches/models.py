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

    # Utilisation de ForeignKey pour lier le responsable à la table Utilisateur
    responsable = models.ForeignKey('Utilisateur', on_delete=models.CASCADE, related_name='taches_responsables')

    intitule = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    type_tache = models.CharField(max_length=50, choices=TYPE_CHOICES)

    date_debut = models.DateField()
    date_fin = models.DateField()

    priorite = models.CharField(
        max_length=20,
        choices=PRIORITE_CHOICES,
        default="Moyenne"
    )

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="Planifiée"
    )

    observations = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tache_planifiee"
        ordering = ["-created_at"]

    def __str__(self):
        return self.intitule