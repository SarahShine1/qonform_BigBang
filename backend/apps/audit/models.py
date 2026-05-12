from django.db import models
from .models_terrain import AuditTerrain

id_audit_terrain = models.IntegerField(null=True, blank=True, db_column="id_audit_terrain")

# Create your models here.
