# Generated manually for the organigramme feature.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='OrganizationUnit',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=40, unique=True)),
                ('name', models.CharField(max_length=120)),
                ('type', models.CharField(choices=[('ROOT', 'Racine'), ('DIRECTION', 'Direction'), ('DEPARTMENT', 'Departement'), ('SERVICE', 'Service'), ('CELLULE', 'Cellule')], max_length=20)),
                ('level', models.PositiveSmallIntegerField(default=1)),
                ('description', models.TextField(blank=True)),
                ('responsable_id', models.IntegerField(blank=True, null=True)),
                ('created_by_id', models.IntegerField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='children', to='organigramme.organizationunit')),
            ],
            options={
                'db_table': 'organization_unit',
                'ordering': ['level', 'code', 'name'],
            },
        ),
        migrations.AddIndex(
            model_name='organizationunit',
            index=models.Index(fields=['parent', 'is_active'], name='organizatio_parent__af9400_idx'),
        ),
        migrations.AddIndex(
            model_name='organizationunit',
            index=models.Index(fields=['type', 'is_active'], name='organizatio_type_561dbf_idx'),
        ),
    ]
