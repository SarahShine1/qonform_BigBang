from django.db import models


class Document(models.Model):


    TYPE_DOCUMENT_CHOICES = [
        
   
        ("BPMN",               "Diagramme BPMN"),
        ("Rapport",            "Rapport"),
        ("Preuve",             "Preuve"),
        ("Support",            "Support"),
        ("Rapport_audit_fiche","Rapport d'audit fiche"),
        ("PV",                 "PV"),

    ]

    TYPE_SUPPORT_CHOICES = [
        ("Guide", "Guide"),
        ("Reglementation", "Réglementation"),
        ("Norme", "Norme"),
    ]


    id_document     = models.AutoField(primary_key=True)
    id_version      = models.IntegerField(null=True, blank=True)
    id_uploader     = models.IntegerField()
    nom_fichier     = models.CharField(max_length=500)
    type_document   = models.CharField(max_length=50, choices=TYPE_DOCUMENT_CHOICES)
    chemin_stockage = models.CharField(max_length=1000)
    taille          = models.IntegerField(null=True, blank=True)
    version_doc     = models.CharField(max_length=50, null=True, blank=True)
    date_upload     = models.DateTimeField(auto_now_add=True)
    description     = models.TextField(null=True, blank=True)
    type_support    = models.CharField(max_length=50, null=True, blank=True)
    id_audit_field  = models.IntegerField(null=True, blank=True)
    evaluation      = models.CharField(max_length=20, choices=EVALUATION_CHOICES, null=True, blank=True)
    id_pv = models.IntegerField(null=True, blank=True)


    class Meta:
        managed = False          # Supabase est la source de vérité
        db_table = "document"

    def __str__(self):
        return f"{self.nom_fichier} ({self.type_document})"