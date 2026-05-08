from rest_framework import serializers
from .models import Processus


class ProcessusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Processus
        fields = [
            "id_processus", "code_process", "nom", "description",
            "type_process", "id_departement", "id_pilote", "created_at",
        ]
        read_only_fields = ["id_processus", "created_at"]
