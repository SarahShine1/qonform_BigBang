from django.db import migrations

from apps.maturity.seed_data import MATURITY_ARTICLES


def seed_reference_data(apps, schema_editor):
    MaturityArticle = apps.get_model("maturity", "MaturityArticle")
    MaturityRequirement = apps.get_model("maturity", "MaturityRequirement")

    for article_data in MATURITY_ARTICLES:
        article, _ = MaturityArticle.objects.get_or_create(
            code=article_data["code"],
            defaults={
                "label": article_data["label"],
                "full_title": article_data["full_title"],
                "weight": article_data["weight"],
                "position": article_data["position"],
            },
        )

        for index, requirement_data in enumerate(article_data["requirements"], start=1):
            MaturityRequirement.objects.get_or_create(
                reference=requirement_data["reference"],
                defaults={
                    "article": article,
                    "text": requirement_data["text"],
                    "position": index,
                },
            )


def unseed_reference_data(apps, schema_editor):
    MaturityRequirement = apps.get_model("maturity", "MaturityRequirement")
    MaturityArticle = apps.get_model("maturity", "MaturityArticle")

    references = [
        requirement["reference"]
        for article in MATURITY_ARTICLES
        for requirement in article["requirements"]
    ]
    codes = [article["code"] for article in MATURITY_ARTICLES]

    MaturityRequirement.objects.filter(reference__in=references).delete()
    MaturityArticle.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("maturity", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_reference_data, unseed_reference_data),
    ]
