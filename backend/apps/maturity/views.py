from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    MaturityAssessment,
    MaturityArticle,
    MaturityRequirement,
    MaturityRequirementResponse,
)
from .seed_data import MATURITY_ARTICLES
from .serializers import (
    MaturityAssessmentUpdateSerializer,
    build_assessment_payload,
)


def ensure_reference_data():
    if MaturityArticle.objects.exists():
        return

    for article_data in MATURITY_ARTICLES:
        article = MaturityArticle.objects.create(
            code=article_data["code"],
            label=article_data["label"],
            full_title=article_data["full_title"],
            weight=article_data["weight"],
            position=article_data["position"],
        )

        for index, requirement_data in enumerate(article_data["requirements"], start=1):
            MaturityRequirement.objects.create(
                article=article,
                reference=requirement_data["reference"],
                text=requirement_data["text"],
                position=index,
            )


def get_or_create_assessment(user):
    ensure_reference_data()

    assessment, _ = MaturityAssessment.objects.get_or_create(user=user)
    existing_requirement_ids = set(
        assessment.responses.values_list("requirement_id", flat=True)
    )

    missing_responses = [
        MaturityRequirementResponse(assessment=assessment, requirement=requirement)
        for requirement in MaturityRequirement.objects.select_related("article").all()
        if requirement.id not in existing_requirement_ids
    ]
    if missing_responses:
        MaturityRequirementResponse.objects.bulk_create(missing_responses)

    return assessment


class MyMaturityAssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        assessment = get_or_create_assessment(request.user)
        return Response(build_assessment_payload(assessment))

    @transaction.atomic
    def put(self, request):
        assessment = get_or_create_assessment(request.user)
        serializer = MaturityAssessmentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        responses_map = {
            response.requirement_id: response
            for response in assessment.responses.select_related("requirement").all()
        }

        for entry in serializer.validated_data["responses"]:
            response = responses_map.get(entry["requirement_id"])
            if not response:
                continue

            response.score = int(entry["score"])
            response.evidence = entry.get("preuve", "")
            response.save(update_fields=["score", "evidence", "updated_at"])

        assessment.save(update_fields=["updated_at"])
        return Response(build_assessment_payload(assessment))

