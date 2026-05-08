from django.db import models


class OrganizationUnit(models.Model):
    class UnitType(models.TextChoices):
        ROOT = 'ROOT', 'Racine'
        DIRECTION = 'DIRECTION', 'Direction'
        DEPARTMENT = 'DEPARTMENT', 'Departement'
        SERVICE = 'SERVICE', 'Service'
        CELLULE = 'CELLULE', 'Cellule'

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=120)
    type = models.CharField(max_length=20, choices=UnitType.choices)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children',
        on_delete=models.PROTECT,
    )
    level = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)
    responsable_id = models.IntegerField(null=True, blank=True)
    created_by_id = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organization_unit'
        ordering = ['level', 'code', 'name']
        indexes = [
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['type', 'is_active']),
        ]

    def __str__(self):
        return f'{self.code} - {self.name}'

