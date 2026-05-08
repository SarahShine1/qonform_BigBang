from rest_framework import serializers
from .models import Processus
from apps.accounts.models import Utilisateur, Departement


class ProcessusSerializer(serializers.ModelSerializer):
    pilote_nom = serializers.SerializerMethodField()
    departement_nom = serializers.SerializerMethodField()

    def get_pilote_nom(self, obj):
        if obj.id_pilote:
            try:
                u = Utilisateur.objects.get(id_user=obj.id_pilote)
                return f"{u.prenom} {u.nom}"
            except Utilisateur.DoesNotExist:
                return None
        return None

    def get_departement_nom(self, obj):
        if obj.id_departement:
            try:
                return Departement.objects.get(id_departement=obj.id_departement).nom
            except Departement.DoesNotExist:
                return None
        return None

    class Meta:
        model = Processus
        fields = [
            "id_processus", "code_process", "nom", "description",
            "type_process", "id_departement", "departement_nom",
            "id_pilote", "pilote_nom", "created_at",
        ]
        read_only_fields = ["id_processus", "created_at", "pilote_nom", "departement_nom"]
