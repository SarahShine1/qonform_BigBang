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


class ProcessusExterne(models.Model):
    id_processus_externe = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "processus_externe"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class ProcessusLiaisonExterne(models.Model):
    SENS_CHOICES = [("amont", "Amont"), ("aval", "Aval")]

    id = models.AutoField(primary_key=True)
    id_processus = models.IntegerField()
    id_processus_externe = models.IntegerField()
    sens = models.CharField(max_length=10, choices=SENS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "processus_liaison_externe"
        unique_together = [("id_processus", "id_processus_externe", "sens")]
