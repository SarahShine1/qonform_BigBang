from rest_framework import serializers
from .models import TachePlanifiee


class TachePlanifieeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="id_tache", read_only=True)
    responsable_nom = serializers.SerializerMethodField()
    createur_nom = serializers.SerializerMethodField()

    class Meta:
        model = TachePlanifiee
        fields = [
            "id",
            "id_tache",
            "intitule",
            "description",
            "type_tache",
            "responsable",
            "responsable_nom",
            "createur",
            "createur_nom",
            "date_debut",
            "date_fin",
            "priorite",
            "statut",
            "observations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "id_tache",
            "responsable_nom",
            "createur_nom",
            "created_at",
            "updated_at",
        ]

    def get_responsable_nom(self, obj):
        if obj.responsable:
            return f"{obj.responsable.nom} {obj.responsable.prenom}"
        return ""

    def get_createur_nom(self, obj):
        if obj.createur:
            return f"{obj.createur.nom} {obj.createur.prenom}"
        return ""