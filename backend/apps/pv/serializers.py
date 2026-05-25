from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import Utilisateur
from apps.documents.models import Document
from apps.notifications.utils import notifier_participants_pv

from .models import PV


User = get_user_model()


class PVSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(),
        many=True,
        required=True,
    )
    fichier = serializers.FileField(
        write_only=True,
        required=True,
    )
    code = serializers.CharField(read_only=True)
    document_data = serializers.SerializerMethodField(read_only=True)
    participants_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PV
        fields = [
            "id",
            "code",
            "type",
            "categorie",
            "statut",
            "date",
            "participants",
            "participants_data",
            "document_data",
            "fichier",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "code",
            "categorie",
            "statut",
            "created_at",
            "updated_at",
        ]

    def get_document_data(self, obj):
        document = Document.objects.filter(id_pv=obj.id).first()
        if not document:
            return None

        return {
            "id": document.id_document,
            "nom_fichier": document.nom_fichier,
            "chemin_stockage": document.chemin_stockage,
            "date_upload": document.date_upload,
            "taille": document.taille,
        }

    def get_participants_data(self, obj):
        participants_data = []
        for user in obj.participants.all():
            try:
                utilisateur = Utilisateur.objects.get(auth_id=user.id)
                participants_data.append(
                    {
                        "id": utilisateur.id_user,
                        "nom": utilisateur.nom,
                        "prenom": utilisateur.prenom,
                        "email": utilisateur.email,
                        "username": getattr(user, "username", "") or utilisateur.email,
                    }
                )
            except Utilisateur.DoesNotExist:
                participants_data.append(
                    {
                        "id": user.id,
                        "nom": user.last_name,
                        "prenom": user.first_name,
                        "email": user.email,
                        "username": user.username,
                    }
                )
        return participants_data

    def validate_type(self, value):
        allowed_types = {choice[0] for choice in PV.PV_TYPES}
        if value not in allowed_types:
            raise serializers.ValidationError(
                f"Type invalide. Valeurs autorisees : {', '.join(sorted(allowed_types))}."
            )
        return value

    def validate(self, attrs):
        if not attrs.get("participants"):
            raise serializers.ValidationError(
                {"participants": "At least one participant is required."}
            )
        if not attrs.get("fichier") and self.instance is None:
            raise serializers.ValidationError(
                {"fichier": "A PDF file is required."}
            )
        return attrs

    def create(self, validated_data):
        participants_utilisateurs = validated_data.pop("participants", [])
        fichier = validated_data.pop("fichier")

        request = self.context.get("request")
        current_user = request.user if request else None

        if not current_user or not current_user.is_authenticated:
            raise serializers.ValidationError(
                {"detail": "Authentication required."}
            )

        try:
            participants_users = [
                utilisateur.auth
                for utilisateur in participants_utilisateurs
                if getattr(utilisateur, "auth_id", None)
            ]

            pv = PV.objects.create(categorie="PV", **validated_data)
            pv.participants.set(participants_users)

            file_name = fichier.name
            file_path = f"pv/{timezone.now().strftime('%Y/%m/%d')}/{file_name}"
            stored_path = default_storage.save(file_path, fichier)

            utilisateur_current = Utilisateur.objects.filter(auth_id=current_user.id).first()
            if not utilisateur_current:
                raise serializers.ValidationError(
                    {
                        "detail": (
                            f"Profil introuvable pour auth_id={current_user.id} "
                            "verifiez la table Utilisateur."
                        )
                    }
                )

            Document.objects.create(
                id_uploader=utilisateur_current.id_user,
                nom_fichier=file_name,
                type_document="PV",
                chemin_stockage=stored_path,
                taille=fichier.size,
                description=f"Document PV {pv.code}",
                type_support="PDF",
                id_pv=pv.id,
            )

            notifier_participants_pv(pv)
            return pv
        except Exception as exc:
            if "pv" in locals():
                try:
                    pv.delete()
                except Exception:
                    pass
            raise serializers.ValidationError(
                {"detail": f"Error creating PV: {exc}"}
            )

    def update(self, instance, validated_data):
        participants = validated_data.pop("participants", None)
        validated_data.pop("fichier", None)

        if "type" in validated_data:
            instance.type = validated_data.get("type", instance.type)
        instance.date = validated_data.get("date", instance.date)

        if participants is not None:
            participant_users = [
                utilisateur.auth
                for utilisateur in participants
                if getattr(utilisateur, "auth_id", None)
            ]
            instance.participants.set(participant_users)

        instance.save()
        return instance
