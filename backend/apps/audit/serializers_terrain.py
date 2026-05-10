from rest_framework import serializers
from .models_terrain import AuditTerrain
from apps.accounts.models import Departement


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departement
        fields = ["id_departement", "nom"]


class AuditTerrainListSerializer(serializers.ModelSerializer):
    departement_nom = serializers.CharField(
        source="id_departement.nom", read_only=True
    )
    
    auditeur_nom = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    class Meta:
        model = AuditTerrain
        fields = [
            "id_audit_field",
            "date_audit",
            "observation",
        
            "created_at",
            "departement_nom",
          
            "auditeur_nom",
            "documents",
        ]

    def get_auditeur_nom(self, obj):
        u = obj.id_auditeur
        return f"{u.prenom} {u.nom}".strip() if u else ""

    def get_documents(self, obj):
        from apps.documents.models import Document
        try:
            docs = Document.objects.filter(id_audit_field=obj.id_audit_field)
            return [
                {
                    "id_document": d.id_document,
                    "nom_fichier": d.nom_fichier,
                    "taille": d.taille,
                    "date_upload": d.date_upload,
                }
                for d in docs
            ]
        except Exception:
            return []


class AuditTerrainCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditTerrain
        fields = [
            "id_departement",
            "date_audit",
            "observation",
          
        ]