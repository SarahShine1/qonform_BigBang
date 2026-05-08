from rest_framework import serializers
from .models import TachePlanifiee


class TachePlanifieeSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source="type_tache")
    dateDebut = serializers.DateField(source="date_debut")
    dateFin = serializers.DateField(source="date_fin")

    class Meta:
        model = TachePlanifiee
        fields = [
            "id",
            "intitule",
            "description",
            "type",
            "responsable",
            "dateDebut",
            "dateFin",
            "priorite",
            "statut",
            "observations",
        ]

    def create(self, validated_data):
        return TachePlanifiee.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance