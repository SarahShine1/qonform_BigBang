from django.db import models


class Processus(models.Model):
    TYPE_CHOICES = [
        ("Management", "Management"),
        ("Realisation", "Réalisation"),
        ("Support", "Support"),
    ]

    id_processus = models.AutoField(primary_key=True)
    code_process = models.CharField(max_length=100, unique=True)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type_process = models.CharField(max_length=20, choices=TYPE_CHOICES)
    id_departement = models.IntegerField()
    id_pilote = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "processus"
        ordering = ["nom"]

    def __str__(self):
        return self.nom
