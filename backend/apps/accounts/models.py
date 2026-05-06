from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom user model that uses email as the primary login identifier.
    USERNAME_FIELD = 'email' means simplejwt and Django auth will
    authenticate against the email column.
    REQUIRED_FIELDS keeps 'username' for Django admin / createsuperuser
    compatibility (AbstractUser requires it to be non-empty).

    We override the email field to enforce uniqueness, which is required
    when USERNAME_FIELD = 'email' (Django auth.E003).
    """
    email = models.EmailField(
        verbose_name='email address',
        max_length=254,
        unique=True,
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        # Let Django manage the auth_user table (already created by 0001_initial)
        pass


class Utilisateur(models.Model):
    """
    Application-level user profile that maps to the existing 'utilisateur'
    PostgreSQL table on Supabase.  managed = False prevents Django from
    creating, altering, or dropping this table.
    """
    id_user = models.AutoField(primary_key=True)
    auth = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='utilisateur',
        db_column='auth_id',
        null=True,
        blank=True,
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    est_actif = models.BooleanField(default=True)
    # id_departement references the 'departement' table.
    # Using IntegerField (instead of a FK) because the Departement Django
    # model does not exist yet; the table is managed directly on Supabase.
    id_departement = models.IntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'utilisateur'

    def __str__(self):
        return f"{self.prenom} {self.nom} <{self.email}>"


class Role(models.Model):
    """
    Maps to the existing 'role' table on Supabase.
    Possible libelle values: CAQ, Auditeur, Pilote, Agent, Direction.
    """
    id_role = models.AutoField(primary_key=True)
    libelle = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'role'

    def __str__(self):
        return self.libelle


class UserRole(models.Model):
    """
    Pivot table linking Utilisateur to Role with an optional expiration date.
    Maps to the existing 'user_role' table on Supabase.

    The SQL table has a composite PK (id_user, id_role).  Since Django
    requires a single primary-key field on unmanaged models and managed=False
    means Django never touches the actual table definition, we rely on
    unique_together to express the composite uniqueness constraint at the
    ORM level.  Django will add an implicit 'id' AutoField as the ORM PK,
    but this field does not exist in the real DB table — queries should
    always filter by (utilisateur, role) rather than by id.
    """
    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        db_column='id_user',
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column='id_role',
    )
    date_expiration = models.DateField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'user_role'
        unique_together = [('utilisateur', 'role')]

    def __str__(self):
        return f"{self.utilisateur} — {self.role} (exp: {self.date_expiration})"
