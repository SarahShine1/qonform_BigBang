from django.db import models


class Document(models.Model):

    TYPE_DOCUMENT_CHOICES = [
        ("BPMN", "BPMN"),
        ("Rapport", "Rapport"),
        ("Preuve", "Preuve"),
    ]

    TYPE_SUPPORT_CHOICES = [
        ("Guide", "Guide"),
        ("Reglementation", "Réglementation"),
        ("Norme", "Norme"),
    ]

    id_document = models.AutoField(primary_key=True)

    id_version = models.IntegerField(null=True, blank=True, db_column="id_version")

    id_uploader = models.ForeignKey(
        "accounts.Utilisateur",         # ← adaptez selon votre app
        models.DO_NOTHING,
        db_column="id_uploader",
    )

    nom_fichier = models.CharField(max_length=255)

    type_document = models.CharField(
        max_length=30,
        choices=TYPE_DOCUMENT_CHOICES,
    )

    chemin_stockage = models.CharField(max_length=500)
    taille = models.IntegerField(blank=True, null=True)
    version_doc = models.CharField(max_length=10, blank=True, null=True)
    date_upload = models.DateTimeField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    type_support = models.CharField(
        max_length=30,
        choices=TYPE_SUPPORT_CHOICES,
        blank=True,
        null=True,
    )

    class Meta:
        managed = False          # Supabase est la source de vérité
        db_table = "document"

    def __str__(self):
        return f"{self.nom_fichier} ({self.type_document})"