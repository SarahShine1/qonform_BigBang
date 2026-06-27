from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0006_alter_utilisateursettings_utilisateur"),
    ]

    operations = [
        migrations.CreateModel(
            name="DictionaryTerm",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("term", models.CharField(max_length=150, unique=True)),
                ("normalized_term", models.CharField(db_index=True, max_length=180)),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("Qualite", "Qualite"),
                            ("Audit", "Audit"),
                            ("Processus", "Processus"),
                            ("ISO 9001", "ISO 9001"),
                            ("Documentaire", "Documentaire"),
                            ("Risque", "Risque"),
                            ("Indicateur", "Indicateur"),
                            ("Autre", "Autre"),
                        ],
                        max_length=50,
                    ),
                ),
                ("definition", models.TextField()),
                ("example", models.TextField(blank=True, default="")),
                ("synonyms", models.JSONField(blank=True, default=list)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name="dictionary_terms_created",
                        to="accounts.utilisateur",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name="dictionary_terms_updated",
                        to="accounts.utilisateur",
                    ),
                ),
            ],
            options={
                "ordering": ["term", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="dictionaryterm",
            constraint=models.UniqueConstraint(
                fields=("normalized_term",),
                name="uniq_dictionary_normalized_term",
            ),
        ),
    ]
