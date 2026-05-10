from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id_document", models.AutoField(primary_key=True, serialize=False)),
                (
                    "id_uploader",
                    models.ForeignKey(
                        db_column="id_uploader",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="documents_uploades",
                        to="accounts.utilisateur",
                    ),
                ),
                ("nom_fichier", models.CharField(max_length=255)),
                ("chemin_stockage", models.CharField(max_length=500)),
                ("taille", models.IntegerField(blank=True, null=True)),
                ("code_documentaire", models.CharField(blank=True, max_length=100, null=True)),
                ("date_upload", models.DateTimeField(auto_now_add=True)),
                ("description", models.TextField(blank=True, null=True)),
            ],
            options={
                "db_table": "document",
                "ordering": ["-date_upload"],
            },
        ),
    ]