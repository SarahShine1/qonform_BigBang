from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MaturityArticle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=12, unique=True)),
                ("label", models.CharField(max_length=12)),
                ("full_title", models.CharField(max_length=120)),
                ("weight", models.PositiveSmallIntegerField(default=10)),
                ("position", models.PositiveSmallIntegerField(default=0)),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="MaturityAssessment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="maturity_assessment", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.CreateModel(
            name="MaturityRequirement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reference", models.CharField(max_length=24, unique=True)),
                ("text", models.TextField()),
                ("position", models.PositiveSmallIntegerField(default=0)),
                (
                    "article",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="requirements", to="maturity.maturityarticle"),
                ),
            ],
            options={"ordering": ["article__position", "position", "id"]},
        ),
        migrations.CreateModel(
            name="MaturityRequirementResponse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("score", models.PositiveSmallIntegerField(choices=[(0, "Non realise"), (33, "Partiel"), (66, "Realise"), (100, "Optimise")], default=0)),
                ("evidence", models.TextField(blank=True, default="")),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "assessment",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responses", to="maturity.maturityassessment"),
                ),
                (
                    "requirement",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="responses", to="maturity.maturityrequirement"),
                ),
            ],
            options={"ordering": ["requirement__article__position", "requirement__position", "id"], "unique_together": {("assessment", "requirement")}},
        ),
    ]

