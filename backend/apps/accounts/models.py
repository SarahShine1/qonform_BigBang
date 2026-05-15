from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom user model that uses email as the primary login identifier.
    """

    email = models.EmailField(
        verbose_name="email address",
        max_length=254,
        unique=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "accounts_user"


class Departement(models.Model):
    """
    Maps to the existing 'departement' table on Supabase.

    This model is unmanaged because the table already exists in the database.
    It is used only to validate id_departement and to expose the real list
    of departments to the frontend.
    """

    id_departement = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=150)
    code = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = "departement"

    def __str__(self):
        return self.nom


class Utilisateur(models.Model):
    """
    Application-level user profile that maps to the existing 'utilisateur'
    PostgreSQL table on Supabase.
    """

    id_user = models.AutoField(primary_key=True)

    auth = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="utilisateur",
        db_column="auth_id",
        null=True,
        blank=True,
    )

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    est_actif = models.BooleanField(default=True)

    # IMPORTANT:
    # This is intentionally kept as IntegerField because your current database
    # already has the column id_departement. We validate it manually in serializer.
    id_departement = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "utilisateur"

    def __str__(self):
        return f"{self.prenom} {self.nom} <{self.email}>"


class UtilisateurSettings(models.Model):
    """
    Dedicated settings storage attached to the application-level profile.

    We keep this in a separate managed table to avoid risky schema changes on
    the existing unmanaged "utilisateur" table.
    """

    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name="settings",
        db_column="id_user",
        to_field="id_user",
        primary_key=True,
        db_constraint=False,
    )
    photo_profil = models.ImageField(upload_to="profiles/", null=True, blank=True)
    preferences = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "utilisateur_settings"

    def __str__(self):
        return f"Settings for {self.utilisateur_id}"


class Role(models.Model):
    """
    Maps to the existing 'role' table on Supabase.
    """

    id_role = models.AutoField(primary_key=True)
    libelle = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = "role"

    def __str__(self):
        return self.libelle


class UserRole(models.Model):
    """
    Pivot table linking Utilisateur to Role.
    """

    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        db_column="id_user",
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column="id_role",
    )

    date_expiration = models.DateField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "user_role"
        unique_together = [("utilisateur", "role")]

    def __str__(self):
        return f"{self.utilisateur} — {self.role} (exp: {self.date_expiration})"
