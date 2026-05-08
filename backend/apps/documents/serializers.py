# backend/apps/documents/serializers.py

from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    publie_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'titre', 'fichier', 'publie_par_nom', 'date_publication']
        read_only_fields = ['date_publication', 'publie_par_nom']

    def get_publie_par_nom(self, obj):
        if obj.publie_par:
            nom = f"{obj.publie_par.first_name} {obj.publie_par.last_name}".strip()
            return nom if nom else obj.publie_par.username
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['titre', 'fichier']

    def validate_fichier(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Seuls les fichiers PDF sont acceptés.")
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 20 Mo.")
        return value