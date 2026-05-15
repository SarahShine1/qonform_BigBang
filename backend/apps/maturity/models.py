from django.conf import settings
from django.db import models


class MaturityArticle(models.Model):
    code = models.CharField(max_length=12, unique=True)
    label = models.CharField(max_length=12)
    full_title = models.CharField(max_length=120)
    weight = models.PositiveSmallIntegerField(default=10)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return self.full_title


class MaturityRequirement(models.Model):
    article = models.ForeignKey(
        MaturityArticle,
        on_delete=models.CASCADE,
        related_name="requirements",
    )
    reference = models.CharField(max_length=24, unique=True)
    text = models.TextField()
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["article__position", "position", "id"]

    def __str__(self):
        return self.reference


class MaturityAssessment(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="maturity_assessment",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Maturity assessment for {self.user_id}"


class MaturityRequirementResponse(models.Model):
    SCORE_CHOICES = [
        (0, "Non realise"),
        (33, "Partiel"),
        (66, "Realise"),
        (100, "Optimise"),
    ]

    assessment = models.ForeignKey(
        MaturityAssessment,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    requirement = models.ForeignKey(
        MaturityRequirement,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    score = models.PositiveSmallIntegerField(choices=SCORE_CHOICES, default=0)
    evidence = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("assessment", "requirement")]
        ordering = ["requirement__article__position", "requirement__position", "id"]

    def __str__(self):
        return f"{self.assessment_id} - {self.requirement.reference}"

