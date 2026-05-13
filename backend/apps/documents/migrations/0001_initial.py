from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id_document",     models.AutoField(primary_key=True, serialize=False)),
                ("id_version",      models.IntegerField(blank=True, null=True)),
                ("id_uploader",     models.IntegerField()),
                ("nom_fichier",     models.CharField(max_length=500)),
                ("type_document",   models.CharField(
                    max_length=50,
                    choices=[
                        ("BPMN",                "Diagramme BPMN"),
                        ("Rapport",             "Rapport"),
                        ("Preuve",              "Preuve"),
                        ("Support",             "Support"),
                        ("Rapport_audit_fiche", "Rapport d'audit fiche"),
                    ],
                )),
                ("chemin_stockage", models.CharField(max_length=1000)),
                ("taille",          models.IntegerField(blank=True, null=True)),
                ("version_doc",     models.CharField(blank=True, max_length=50, null=True)),
                ("date_upload",     models.DateTimeField(auto_now_add=True)),
                ("description",     models.TextField(blank=True, null=True)),
                ("type_support",    models.CharField(blank=True, max_length=50, null=True)),
                ("id_audit_field",  models.IntegerField(blank=True, null=True)),
                ("evaluation",      models.CharField(
                    blank=True, null=True, max_length=20,
                    choices=[
                        ("Conforme",     "Conforme"),
                        ("Non_conforme", "Non conforme"),
                        ("Partiel",      "Partiel"),
                        ("NA",           "N/A"),
                    ],
                )),
            ],
            options={
                "db_table": "document",
                "ordering": ["-date_upload"],
                "managed": False,
            },
        ),
    ]
