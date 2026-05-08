# backend/apps/documents/admin.py

from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'titre', 'publie_par', 'date_publication']
    list_filter = ['date_publication']
    search_fields = ['titre', 'publie_par__first_name', 'publie_par__last_name']
    readonly_fields = ['date_publication']
    ordering = ['-date_publication']