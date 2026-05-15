from rest_framework import serializers

from .models import (
    MaturityAssessment,
    MaturityArticle,
    MaturityRequirement,
    MaturityRequirementResponse,
)


VALID_MATURITY_SCORES = [0, 33, 66, 100]


def article_score(requirements):
    if not requirements:
        return 0
    total = sum(requirement["score"] for requirement in requirements)
    return round(total / len(requirements))


def global_weighted_score(articles):
    total_weight = sum(article["poids"] for article in articles)
    if not total_weight:
        return 0
    weighted_total = sum(article["score"] * article["poids"] for article in articles)
    return round(weighted_total / total_weight)


def interpretation_label(score):
    if score >= 80:
        return "Optimise"
    if score >= 60:
        return "Maitrise"
    if score >= 33:
        return "En progression"
    return "Initial"


def build_assessment_payload(assessment: MaturityAssessment):
    ordered_responses = list(
        assessment.responses.select_related("requirement", "requirement__article")
        .all()
        .order_by("requirement__article__position", "requirement__position", "id")
    )

    articles_map = {}
    for response in ordered_responses:
        article = response.requirement.article
        article_entry = articles_map.setdefault(
            article.id,
            {
                "id": article.code,
                "db_id": article.id,
                "label": article.label,
                "full": article.full_title,
                "poids": article.weight,
                "position": article.position,
                "exigences": [],
            },
        )
        article_entry["exigences"].append(
            {
                "id": response.requirement.id,
                "response_id": response.id,
                "ref": response.requirement.reference,
                "text": response.requirement.text,
                "score": response.score,
                "preuve": response.evidence,
            }
        )

    articles = list(articles_map.values())
    for article in articles:
        article["score"] = article_score(article["exigences"])

    global_score = global_weighted_score(articles)
    radar = [
        {
            "article": article["label"],
            "score": article["score"],
            "full": article["full"],
        }
        for article in articles
    ]

    return {
        "assessment_id": assessment.id,
        "saved_at": assessment.updated_at,
        "global_score": global_score,
        "interpretation": interpretation_label(global_score),
        "radar": radar,
        "articles": articles,
    }


class MaturityRequirementResponseWriteSerializer(serializers.Serializer):
    requirement_id = serializers.IntegerField()
    score = serializers.ChoiceField(choices=VALID_MATURITY_SCORES)
    preuve = serializers.CharField(required=False, allow_blank=True)

    def validate_requirement_id(self, value):
        if not MaturityRequirement.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Exigence introuvable.")
        return value


class MaturityAssessmentUpdateSerializer(serializers.Serializer):
    responses = MaturityRequirementResponseWriteSerializer(many=True)

    def validate_responses(self, value):
        requirement_ids = [entry["requirement_id"] for entry in value]
        if len(requirement_ids) != len(set(requirement_ids)):
            raise serializers.ValidationError("Chaque exigence ne doit apparaitre qu'une seule fois.")
        return value

