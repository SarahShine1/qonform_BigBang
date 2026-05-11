from django.db import models
from apps.accounts.models import Utilisateur


class AuditTerrain(models.Model):

    

    id_audit_field = models.AutoField(primary_key=True)

    id_auditeur = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        db_column="id_auditeur",
        related_name="audits_terrain",
    )

    id_departement = models.ForeignKey(
        "accounts.Departement",
        on_delete=models.PROTECT,
        db_column="id_departement",
        related_name="audits_terrain",
    )

    date_audit = models.DateField()
    observation = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = "audit_field"

    def __str__(self):
        return f"Audit {self.id_departement} — {self.date_audit}"