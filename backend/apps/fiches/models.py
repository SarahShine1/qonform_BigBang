from django.db import models


class SectionTemplate(models.Model):
    id_section_template = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    ordre = models.IntegerField(default=1)
    est_actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "section_template"
        ordering = ["ordre"]

    def __str__(self):
        return self.nom


class ChampTemplate(models.Model):
    TYPE_CHOICES = [
        ("text", "Texte"),
        ("nombre", "Nombre"),
        ("date", "Date"),
        ("booleen", "Booléen"),
        ("checklist", "Checklist"),
        ("liste", "Liste"),
        ("tableau", "Tableau"),
    ]

    id_champ_template = models.AutoField(primary_key=True)
    id_section_template = models.IntegerField()
    libelle = models.CharField(max_length=255)
    type_champ = models.CharField(max_length=20, choices=TYPE_CHOICES)
    configuration = models.JSONField(default=dict)
    est_obligatoire = models.BooleanField(default=False)
    placeholder = models.CharField(max_length=255, blank=True, null=True)
    aide = models.TextField(blank=True, null=True)
    ordre = models.IntegerField(default=1)
    est_actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = "champ_template"
        ordering = ["ordre"]

    def __str__(self):
        return self.libelle


class StatutFiche(models.Model):
    id_statut = models.AutoField(primary_key=True)
    libelle = models.CharField(max_length=255, unique=True)
    ordre = models.IntegerField()
    couleur = models.CharField(max_length=50, blank=True, null=True)
    est_final = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = "statut_fiche"
        ordering = ["ordre"]

    def __str__(self):
        return self.libelle


class VersionFiche(models.Model):
    id_version = models.AutoField(primary_key=True)
    id_processus = models.IntegerField()
    statut = models.CharField(
        max_length=20,
        default="Brouillon",
        choices=[
            ("Brouillon",   "Brouillon"),
            ("Soumise",     "Soumise"),
            ("En_revision", "En révision"),
            ("Publiee",     "Publiée"),
            ("Archivee",    "Archivée"),
        ],
    )
    id_redacteur = models.IntegerField()
    numero_version = models.CharField(max_length=50)
    commentaire_version = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_modif = models.DateTimeField(blank=True, null=True)
    date_validation = models.DateTimeField(blank=True, null=True)
    id_processus_amont = models.IntegerField(blank=True, null=True)
    id_processus_aval = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "version_fiche"

    def __str__(self):
        return f"Fiche v{self.numero_version} (processus {self.id_processus})"


class ChampFiche(models.Model):
    # La contrainte DB n'accepte que ces 5 valeurs
    TYPE_CHOICES = [
        ("texte", "Texte"),
        ("nombre", "Nombre"),
        ("date", "Date"),
        ("booleen", "Booléen"),
        ("liste", "Liste"),
    ]

    id_champ = models.AutoField(primary_key=True)
    id_version = models.IntegerField()
    libelle = models.CharField(max_length=255)
    type_champ = models.CharField(max_length=20, choices=TYPE_CHOICES)
    valeur = models.TextField(blank=True, null=True)
    est_obligatoire = models.BooleanField(default=False)
    ordre = models.IntegerField(default=1)
    id_champ_template = models.IntegerField(blank=True, null=True)
    valeur_json = models.JSONField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "champ_fiche"
        ordering = ["ordre"]

    def __str__(self):
        return self.libelle
