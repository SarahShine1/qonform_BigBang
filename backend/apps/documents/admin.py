from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['nom_fichier', 'type_document', 'type_support', 'version_doc', 'date_upload']

    list_filter = ("date_upload", "id_uploader")
    search_fields = ("nom_fichier", "code_documentaire")
    ordering = ("-date_upload",)