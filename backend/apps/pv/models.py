from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.accounts.models import Utilisateur

User = get_user_model()


class PVParticipant(models.Model):
    pv = models.ForeignKey(
        'PV',
        on_delete=models.CASCADE,
        db_column='pv_id',
    )
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column='user_id',        # ← FK vers accounts_user.id
    )

    class Meta:
        managed = False
        db_table = 'pv_participants'


class PV(models.Model):
    PV_TYPES = [
        ('SUIVI', 'Follow-up'),
        ('REVUE_DG', 'Meeting'),    # ← underscore, pas espace
    ]

    id = models.AutoField(primary_key=True)
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='PV Code'
    )
    type = models.CharField(
        max_length=20,
        choices=PV_TYPES,
        verbose_name='PV Type'
    )
    date = models.DateField(verbose_name='PV Date')
    participants = models.ManyToManyField(
        User,
        through='PVParticipant',    # ← via User (accounts_user)
        related_name='pv_participations',
        verbose_name='Participants'
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
            models.Index(fields=['type', '-date']),
        ]

    def __str__(self):
        return f"{self.code} - {self.get_type_display()} ({self.date})"

    @staticmethod
    def generate_code(pv_type):
        today = timezone.now().strftime('%Y%m%d')
        base_code = f"PV_{pv_type}_{today}"
        counter = 1
        code = base_code
        while PV.objects.filter(code=code).exists():
            code = f"{base_code}_{counter}"
            counter += 1
        return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code(self.type)
        super().save(*args, **kwargs)