from django.contrib import admin

from .models import DictionaryTerm


@admin.register(DictionaryTerm)
class DictionaryTermAdmin(admin.ModelAdmin):
    list_display = ("term", "category", "is_active", "updated_at")
    list_filter = ("category", "is_active")
    search_fields = ("term", "definition")
    ordering = ("term",)

