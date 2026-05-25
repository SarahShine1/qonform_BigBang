from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class PVValidation(models.Model):
    DECISION_CHOICES = [
        ('APPROUVE', 'Approuvé'),
        ('REJETE', 'Rejeté'),
    ]

    pv = models.ForeignKey(
        'PV',
        on_delete=models.CASCADE,
        related_name='validations',
        db_column='pv_id',
    )
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
    )
    decision = models.CharField(
        max_length=10,
        choices=DECISION_CHOICES,
        null=True,
        blank=True,
    )
    motif = models.TextField(null=True, blank=True)
    date_decision = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'pv_validation'
        unique_together = [('pv', 'utilisateur')]

    def __str__(self):
        return f"Validation PV {self.pv_id} — user {self.utilisateur_id} — {self.decision}"


class PVParticipant(models.Model):
    pv = models.ForeignKey(
        'PV',
        on_delete=models.CASCADE,
        db_column='pv_id',
    )
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',
    )

    class Meta:
        managed = False
        db_table = 'pv_participants'


class PV(models.Model):

    CATEGORIE_CHOICES = [
        ('PV', 'Procès-Verbal'),
        ('COMPTE_RENDU', 'Compte Rendu'),
    ]

    SOUS_TYPE_PV = [
        ('REVUE_DG', 'Revue avec DG'),
        ('INTERNE_CAQ', 'Interne CAQ'),
        ('REUNION_SERVICE', 'Réunion de service'),
        ('AUTRE', 'Autre'),
    ]

    SOUS_TYPE_CR = [
        ('REUNION_SUIVI', 'Réunion de suivi'),
        ('FORMATION', 'Formation'),
        ('ENQUETE', 'Enquête'),
        ('AUTRE_CR', 'Autre'),
    ]

    SOUS_TYPE_CHOICES = SOUS_TYPE_PV + SOUS_TYPE_CR

    STATUT_CHOICES = [
        ('EN_VALIDATION', 'En cours de validation'),
        ('VALIDE', 'Validé'),
        ('REJETE', 'Rejeté'),
    ]

    id = models.AutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Code')
    categorie = models.CharField(max_length=20, choices=CATEGORIE_CHOICES, verbose_name='Catégorie')
    sous_type = models.CharField(max_length=30, choices=SOUS_TYPE_CHOICES, verbose_name='Sous-type')
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='EN_VALIDATION',  # ← plus de BROUILLON
        verbose_name='Statut',
    )

    createur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pv_crees',
        db_column='createur_id',
        verbose_name='Créateur',
    )
    date = models.DateField(verbose_name='Date')
    participants = models.ManyToManyField(
        User,
        through='PVParticipant',
        related_name='pv_participations',
        verbose_name='Participants',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'pv'
        ordering = ['-date', '-created_at']
        verbose_name = 'PV'
        verbose_name_plural = 'PVs'
        indexes = [
            models.Index(fields=['-date']),
            models.Index(fields=['categorie', '-date']),
            models.Index(fields=['statut']),
        ]

    def __str__(self):
        return f"{self.code} - {self.get_sous_type_display()} ({self.date})"

    # ------------------------------------------------------------------ #
    #  Properties                                                          #
    # ------------------------------------------------------------------ #

    @property
    def is_pv(self):
        return self.categorie == 'PV'

    @property
    def total_participants(self):
        return self.participants.count()

    @property
    def nb_approuves(self):
        return self.validations.filter(decision='APPROUVE').count()

    @property
    def nb_rejetes(self):
        return self.validations.filter(decision='REJETE').count()

    @property
    def nb_en_attente(self):
        return self.validations.filter(decision__isnull=True).count()

    # ------------------------------------------------------------------ #
    #  Méthodes métier                                                     #
    # ------------------------------------------------------------------ #

    def _creer_validations(self):
        """Crée une ligne PVValidation par participant (sans décision)."""
        for user in self.participants.all():
            PVValidation.objects.get_or_create(pv=self, utilisateur=user)

    def enregistrer_decision(self, user, decision, motif=None):   # ← bien indenté dans la classe
        if self.statut != 'EN_VALIDATION':
            raise ValueError("Le PV n'est pas en cours de validation.")

        validation = PVValidation.objects.get(pv=self, utilisateur=user)

        if decision == 'REJETE' and not motif:
            raise ValueError("Un motif est obligatoire en cas de rejet.")

        validation.decision = decision
        validation.motif = motif
        validation.date_decision = timezone.now()
        validation.save()

        if decision == 'REJETE':
            self.statut = 'REJETE'
            self.save(update_fields=['statut', 'updated_at'])
            return 'REJETE'

        if self.nb_approuves == self.total_participants:
            self.statut = 'VALIDE'
            self.save(update_fields=['statut', 'updated_at'])
            return 'VALIDE'

        return 'EN_COURS'

    # ------------------------------------------------------------------ #
    #  Code auto                                                           #
    # ------------------------------------------------------------------ #

    @staticmethod
    def generate_code(categorie, sous_type):
        today = timezone.now().strftime('%Y%m%d')
        prefix = 'PV' if categorie == 'PV' else 'CR'
        
        # Mapping pour simplifier certains codes
        sous_type_code = {
            'AUTRE_CR': 'AUTRE',
        }.get(sous_type, sous_type)
        
        base_code = f"{prefix}_{sous_type_code}_{today}"
        counter = 1
        code = base_code
        while PV.objects.filter(code=code).exists():
            code = f"{base_code}_{counter}"
            counter += 1
        return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code(self.categorie, self.sous_type)
        super().save(*args, **kwargs)