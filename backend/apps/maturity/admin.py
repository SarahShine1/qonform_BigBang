from django.contrib import admin

from .models import (
    MaturityArticle,
    MaturityAssessment,
    MaturityRequirement,
    MaturityRequirementResponse,
)


@admin.register(MaturityArticle)
class MaturityArticleAdmin(admin.ModelAdmin):
    list_display = ("label", "full_title", "weight", "position")
    search_fields = ("label", "full_title", "code")
    ordering = ("position", "id")


@admin.register(MaturityRequirement)
class MaturityRequirementAdmin(admin.ModelAdmin):
    list_display = ("reference", "article", "position")
    search_fields = ("reference", "text")
    list_filter = ("article",)
    ordering = ("article__position", "position", "id")


class MaturityRequirementResponseInline(admin.TabularInline):
    model = MaturityRequirementResponse
    extra = 0


@admin.register(MaturityAssessment)
class MaturityAssessmentAdmin(admin.ModelAdmin):
    list_display = ("user", "updated_at", "created_at")
    search_fields = ("user__email", "user__username")
    inlines = [MaturityRequirementResponseInline]

