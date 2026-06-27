from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import Utilisateur
from apps.documents.models import Document
from apps.notifications.utils import (
    notifier_createur_pv_rejet,
    notifier_createur_pv_valide,
    notifier_participants_pv_creation,
    notifier_participants_pv_soumission,
)

from .models import PV, PVValidation


User = get_user_model()


class PVValidationDetailSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()

    class Meta:
        model = PVValidation
        fields = ["id", "participant", "decision", "motif", "date_decision"]

    def get_participant(self, obj):
        profil = Utilisateur.objects.filter(auth_id=obj.utilisateur_id).first()
        if profil:
            return {
                "id": profil.id_user,
                "nom": profil.nom,
                "prenom": profil.prenom,
                "email": profil.email,
            }
        return {"id": obj.utilisateur_id, "nom": "", "prenom": "", "email": ""}


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["APPROUVE", "REJETE"])
    motif = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["decision"] == "REJETE" and not attrs.get("motif"):
            raise serializers.ValidationError({"motif": "Un motif est obligatoire en cas de rejet."})
        return attrs


class PVSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(),
        many=True,
        required=True,
    )
    fichier = serializers.FileField(write_only=True, required=False)
    code = serializers.CharField(read_only=True)
    statut = serializers.CharField(read_only=True)
    document_data = serializers.SerializerMethodField(read_only=True)
    participants_data = serializers.SerializerMethodField(read_only=True)
    validation_status = serializers.SerializerMethodField(read_only=True)
    createur_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PV
        fields = [
            "id",
            "code",
            "categorie",
            "sous_type",
            "statut",
            "date",
            "createur_data",
            "participants",
            "participants_data",
            "document_data",
            "fichier",
            "validation_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "code", "statut", "created_at", "updated_at"]

    def to_internal_value(self, data):
        # Backward compatibility with older payloads that still send `type`.
        mutable = data.copy()
        if "sous_type" not in mutable and "type" in mutable:
            mutable["sous_type"] = mutable.get("type")
        return super().to_internal_value(mutable)

    def get_createur_data(self, obj):
        if not obj.createur:
            return None
        profil = Utilisateur.objects.filter(auth_id=obj.createur_id).first()
        if profil:
            return {
                "id": profil.id_user,
                "nom": profil.nom,
                "prenom": profil.prenom,
                "email": profil.email,
            }
        return {"id": obj.createur_id, "nom": "", "prenom": "", "email": ""}

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
        result = []
        for user in obj.participants.all():
            try:
                profil = Utilisateur.objects.get(auth_id=user.id)
                result.append(
                    {
                        "id": profil.id_user,
                        "nom": profil.nom,
                        "prenom": profil.prenom,
                        "email": profil.email,
                    }
                )
            except Utilisateur.DoesNotExist:
                result.append(
                    {
                        "id": user.id,
                        "nom": user.last_name,
                        "prenom": user.first_name,
                        "email": user.email,
                    }
                )
        return result

    def get_validation_status(self, obj):
        if not obj.is_pv:
            return None

        validations = obj.validations.select_related("utilisateur").all()
        return {
            "total": obj.total_participants,
            "approuves": obj.nb_approuves,
            "rejetes": obj.nb_rejetes,
            "en_attente": obj.nb_en_attente,
            "detail": PVValidationDetailSerializer(validations, many=True).data,
        }

    def validate(self, attrs):
        categorie = attrs.get("categorie", getattr(self.instance, "categorie", None))
        sous_type = attrs.get("sous_type", getattr(self.instance, "sous_type", None))

        pv_sous_types = [key for key, _ in PV.SOUS_TYPE_PV]
        cr_sous_types = [key for key, _ in PV.SOUS_TYPE_CR]

        if categorie == "PV" and sous_type not in pv_sous_types:
            raise serializers.ValidationError(
                {"sous_type": f"Pour un PV, sous_type doit etre parmi : {pv_sous_types}"}
            )
        if categorie == "COMPTE_RENDU" and sous_type not in cr_sous_types:
            raise serializers.ValidationError(
                {"sous_type": f"Pour un compte rendu, sous_type doit etre parmi : {cr_sous_types}"}
            )
        if not attrs.get("participants") and self.instance is None:
            raise serializers.ValidationError({"participants": "Au moins un participant est requis."})
        if not attrs.get("fichier") and self.instance is None:
            raise serializers.ValidationError({"fichier": "Un fichier PDF est requis."})
        return attrs

    def create(self, validated_data):
        participants_utilisateurs = validated_data.pop("participants", [])
        fichier = validated_data.pop("fichier", None)

        request = self.context.get("request")
        current_user = request.user if request else None
        if not current_user or not current_user.is_authenticated:
            raise serializers.ValidationError({"detail": "Authentification requise."})

        try:
            participants_users = [utilisateur.auth for utilisateur in participants_utilisateurs if utilisateur.auth_id]
            categorie = validated_data.get("categorie")
            validated_data["statut"] = "EN_VALIDATION" if categorie == "PV" else "VALIDE"
            validated_data["createur"] = current_user

            pv = PV.objects.create(**validated_data)
            pv.participants.set(participants_users)

            if fichier is not None:
                file_name = fichier.name
                file_path = f"pv/{timezone.now().strftime('%Y/%m/%d')}/{file_name}"
                stored_path = default_storage.save(file_path, fichier)

                utilisateur_current = Utilisateur.objects.filter(auth_id=current_user.id).first()
                if not utilisateur_current:
                    raise serializers.ValidationError(
                        {"detail": f"Profil introuvable pour auth_id={current_user.id}."}
                    )

                Document.objects.create(
                    id_uploader=utilisateur_current.id_user,
                    nom_fichier=file_name,
                    type_document="PV",
                    chemin_stockage=stored_path,
                    taille=fichier.size,
                    description=f"Document {pv.code}",
                    type_support="PDF",
                    id_pv=pv.id,
                )

            if categorie == "PV":
                pv._creer_validations()
                notifier_participants_pv_soumission(pv)

            notifier_participants_pv_creation(pv)
            return pv
        except Exception as exc:
            if "pv" in locals():
                try:
                    pv.delete()
                except Exception:
                    pass
            raise serializers.ValidationError({"detail": f"Erreur creation PV : {exc}"})

    def update(self, instance, validated_data):
        participants = validated_data.pop("participants", None)
        validated_data.pop("fichier", None)

        for field in ["categorie", "sous_type", "date"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        if participants is not None:
            participant_users = [utilisateur.auth for utilisateur in participants if utilisateur.auth_id]
            instance.participants.set(participant_users)

        instance.save()
        return instance
