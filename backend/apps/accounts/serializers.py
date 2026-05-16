from copy import deepcopy

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.validators import FileExtensionValidator
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Departement, Role, User, Utilisateur, UtilisateurSettings
from .utils import (
    get_active_role_labels_for_user,
    get_auth_user_for_utilisateur,
    get_profile_photo_url,
    normalize_role_names,
    split_full_name,
    sync_roles_for_user,
)


DEFAULT_NOTIFICATION_PREFERENCES = {
    "messagerie": True,
    "audits": True,
    "taches": True,
    "documents": True,
}

DEFAULT_USER_PREFERENCES = {
    "theme": "light",
    "density": "compact",
    "notifications": DEFAULT_NOTIFICATION_PREFERENCES,
}


def build_user_preferences(preferences=None):
    merged = deepcopy(DEFAULT_USER_PREFERENCES)
    incoming = preferences or {}

    if isinstance(incoming, dict):
        theme = incoming.get("theme")
        density = incoming.get("density")
        notifications = incoming.get("notifications")

        if theme in {"light", "dark"}:
            merged["theme"] = theme

        if density in {"compact", "normal"}:
            merged["density"] = density

        if isinstance(notifications, dict):
            for key, default_value in DEFAULT_NOTIFICATION_PREFERENCES.items():
                if key in notifications:
                    merged["notifications"][key] = bool(notifications[key])
                else:
                    merged["notifications"][key] = default_value

    return merged


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email

        utilisateur = Utilisateur.objects.filter(email=user.email).first()
        if utilisateur:
            token["roles"] = get_active_role_labels_for_user(utilisateur.id_user)
            token["departement_id"] = utilisateur.id_departement
        else:
            token["roles"] = []
            token["departement_id"] = None

        return token

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context.get("request")

        email = attrs.get(self.username_field)

        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return validated_data

        if not utilisateur.est_actif:
            raise AuthenticationFailed("Compte désactivé. Contactez l'administrateur.")

        try:
            settings_obj = utilisateur.settings
        except UtilisateurSettings.DoesNotExist:
            settings_obj = None

        validated_data["user"] = {
            "id_user": utilisateur.id_user,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
            "email": utilisateur.email,
            "roles": get_active_role_labels_for_user(utilisateur.id_user),
            "departement": utilisateur.id_departement,
            "photo_profil": get_profile_photo_url(
                settings_obj.photo_profil if settings_obj else None,
                request=request,
            ),
        }

        return validated_data


class UserProfileSerializer(serializers.Serializer):
    id_user = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    roles = serializers.ListField(child=serializers.CharField(), read_only=True)
    departement = serializers.IntegerField(allow_null=True, read_only=True)


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id_role", "libelle"]


class DepartementSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="id_departement", read_only=True)
    name = serializers.CharField(source="nom", read_only=True)
    code = serializers.CharField(read_only=True)

    class Meta:
        model = Departement
        fields = ["id", "name", "code"]


class DepartementSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(source="id_departement", read_only=True)
    nom = serializers.CharField(read_only=True)


class ManagedUserSerializer(serializers.Serializer):
    id_user = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(read_only=True)
    est_actif = serializers.BooleanField(read_only=True)
    statut = serializers.SerializerMethodField()
    departement = serializers.IntegerField(
        source="id_departement",
        allow_null=True,
        read_only=True,
    )
    departement_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.prenom} {obj.nom}".strip()

    def get_statut(self, obj):
        return "Actif" if obj.est_actif else "Desactive"

    def get_roles(self, obj):
        return get_active_role_labels_for_user(obj.id_user)

    def get_departement_name(self, obj):
        if not obj.id_departement:
            return None

        departement = Departement.objects.filter(id_departement=obj.id_departement).first()
        return departement.nom if departement else None


class ManagedUserWriteSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    prenom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=220)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False, allow_blank=False, min_length=8, write_only=True)
    est_actif = serializers.BooleanField(required=False)
    departement = serializers.IntegerField(required=False, allow_null=True)
    send_invitation = serializers.BooleanField(required=False, default=False, write_only=True)
    roles = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    role = serializers.CharField(required=False, allow_blank=True)

    def validate_departement(self, value):
        if value in (None, ""):
            return None

        if not Departement.objects.filter(id_departement=value).exists():
            raise serializers.ValidationError(
                "Departement invalide. Selectionnez un departement existant ou Non assigne."
            )

        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        role = str(attrs.pop("role", "") or "").strip()
        roles = attrs.get("roles")

        if role:
            attrs["roles"] = normalize_role_names([role])
        elif roles is not None:
            attrs["roles"] = normalize_role_names(roles)

        full_name = str(attrs.get("full_name", "") or "").strip()
        nom = str(attrs.get("nom", "") or "").strip()
        prenom = str(attrs.get("prenom", "") or "").strip()

        if full_name and (not nom or not prenom):
            computed_nom, computed_prenom = split_full_name(full_name)
            attrs["nom"] = nom or computed_nom
            attrs["prenom"] = prenom or computed_prenom
        else:
            attrs["nom"] = nom
            attrs["prenom"] = prenom

        is_create = self.instance is None

        if is_create and not attrs.get("email"):
            raise serializers.ValidationError({"email": "Email obligatoire."})
        if is_create and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Mot de passe obligatoire."})
        if is_create and not attrs.get("nom"):
            raise serializers.ValidationError({"nom": "Nom obligatoire."})
        if is_create and not attrs.get("prenom"):
            raise serializers.ValidationError({"prenom": "Prenom obligatoire."})

        email = attrs.get("email")
        if email:
            user_qs = User.objects.filter(email=email)
            utilisateur_qs = Utilisateur.objects.filter(email=email)

            if self.instance:
                auth_user = get_auth_user_for_utilisateur(self.instance)
                user_qs = user_qs.exclude(pk=getattr(auth_user, "pk", None))
                utilisateur_qs = utilisateur_qs.exclude(pk=self.instance.pk)

            if user_qs.exists() or utilisateur_qs.exists():
                raise serializers.ValidationError({"email": "Cet email existe deja."})

        return attrs

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        validated_data.pop("full_name", None)
        send_invitation = validated_data.pop("send_invitation", False)

        email = validated_data["email"]
        temporary_password = validated_data.pop("password")
        est_actif = validated_data.pop("est_actif", True)
        departement = validated_data.pop("departement", None)

        with transaction.atomic():
            auth_user = User.objects.create_user(
                username=email,
                email=email,
                password=temporary_password,
                is_active=est_actif,
            )

            utilisateur = Utilisateur.objects.create(
                auth=auth_user,
                nom=validated_data["nom"],
                prenom=validated_data["prenom"],
                email=email,
                est_actif=est_actif,
                id_departement=departement,
            )

            sync_roles_for_user(utilisateur.id_user, roles)

        self.send_invitation_requested = send_invitation
        self.temporary_password = temporary_password
        return utilisateur

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        validated_data.pop("full_name", None)
        validated_data.pop("send_invitation", None)
        password = validated_data.pop("password", None)

        auth_user = get_auth_user_for_utilisateur(instance)

        if "nom" in validated_data:
            instance.nom = validated_data["nom"]
        if "prenom" in validated_data:
            instance.prenom = validated_data["prenom"]
        if "email" in validated_data:
            instance.email = validated_data["email"]
        if "est_actif" in validated_data:
            instance.est_actif = validated_data["est_actif"]
        if "departement" in validated_data:
            instance.id_departement = validated_data["departement"]

        instance.save()

        if auth_user:
            if "email" in validated_data:
                auth_user.email = validated_data["email"]
                auth_user.username = validated_data["email"]
            if "est_actif" in validated_data:
                auth_user.is_active = validated_data["est_actif"]
            if password:
                auth_user.set_password(password)
            auth_user.save()

        if roles is not None:
            sync_roles_for_user(instance.id_user, roles)

        return instance


class NotificationPreferencesSerializer(serializers.Serializer):
    messagerie = serializers.BooleanField(required=False)
    audits = serializers.BooleanField(required=False)
    taches = serializers.BooleanField(required=False)
    documents = serializers.BooleanField(required=False)


class UserPreferencesSerializer(serializers.Serializer):
    theme = serializers.ChoiceField(choices=["light", "dark"], required=False)
    density = serializers.ChoiceField(choices=["compact", "normal"], required=False)
    notifications = NotificationPreferencesSerializer(required=False)

    def validate(self, attrs):
        base = {}

        if self.instance is not None:
            base = build_user_preferences(getattr(self.instance, "preferences", {}))
        elif self.context.get("preferences"):
            base = build_user_preferences(self.context["preferences"])

        merged = build_user_preferences(base)

        if "theme" in attrs:
            merged["theme"] = attrs["theme"]
        if "density" in attrs:
            merged["density"] = attrs["density"]
        if "notifications" in attrs:
            merged["notifications"].update(attrs["notifications"])

        attrs["preferences"] = merged
        return attrs


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ["nom", "prenom"]

    def validate_nom(self, value):
        value = str(value or "").strip()
        if not value:
            raise serializers.ValidationError("Le nom est obligatoire.")
        return value

    def validate_prenom(self, value):
        value = str(value or "").strip()
        if not value:
            raise serializers.ValidationError("Le prenom est obligatoire.")
        return value

    def update(self, instance, validated_data):
        auth_user = get_auth_user_for_utilisateur(instance)
        updated_fields = []

        for field in ("nom", "prenom"):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
                updated_fields.append(field)

        if updated_fields:
            instance.save(update_fields=updated_fields)

        if auth_user:
            auth_user.last_name = instance.nom
            auth_user.first_name = instance.prenom
            auth_user.save(update_fields=["first_name", "last_name"])

        return instance


class ProfilePhotoUploadSerializer(serializers.Serializer):
    photo = serializers.ImageField(
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])]
    )

    def validate_photo(self, value):
        max_size = 2 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("La photo ne doit pas depasser 2 Mo.")

        allowed_content_types = {"image/jpeg", "image/png", "image/webp"}
        if getattr(value, "content_type", None) not in allowed_content_types:
            raise serializers.ValidationError(
                "Format invalide. Utilisez uniquement JPG, JPEG, PNG ou WEBP."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context["request"]
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if not request.user.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": "Le mot de passe actuel est incorrect."}
            )

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "La confirmation du mot de passe ne correspond pas."}
            )

        validate_password(new_password, request.user)
        return attrs


class UserSettingsSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="id_user", read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    roles = serializers.SerializerMethodField()
    departement = serializers.SerializerMethodField()
    est_actif = serializers.BooleanField(read_only=True)
    photo_profil = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()

    def _get_settings(self, obj):
        try:
            return obj.settings
        except UtilisateurSettings.DoesNotExist:
            return None

    def get_roles(self, obj):
        return get_active_role_labels_for_user(obj.id_user)

    def get_departement(self, obj):
        if not obj.id_departement:
            return None

        departement = Departement.objects.filter(id_departement=obj.id_departement).first()
        if not departement:
            return {"id": obj.id_departement, "nom": f"Departement {obj.id_departement}"}

        return DepartementSummarySerializer(departement).data

    def get_photo_profil(self, obj):
        settings_obj = self._get_settings(obj)
        if not settings_obj or not settings_obj.photo_profil:
            return None

        request = self.context.get("request")
        return get_profile_photo_url(settings_obj.photo_profil, request=request)

    def get_preferences(self, obj):
        settings_obj = self._get_settings(obj)
        raw_preferences = getattr(settings_obj, "preferences", {}) if settings_obj else {}
        return build_user_preferences(raw_preferences)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirmation = serializers.CharField(min_length=8, write_only=True)

    default_error_messages = {
        "invalid_link": "Le lien de reinitialisation est invalide ou a expire.",
        "inactive_account": "Ce compte est désactivé. Contactez l'administrateur.",
    }

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError(
                {"password_confirmation": "Les mots de passe ne correspondent pas."}
            )

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            auth_user = User.objects.get(pk=user_id)
        except Exception as exc:
            raise serializers.ValidationError(
                {"token": self.error_messages["invalid_link"]}
            ) from exc

        if not PasswordResetTokenGenerator().check_token(auth_user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": self.error_messages["invalid_link"]}
            )

        utilisateur = Utilisateur.objects.filter(auth=auth_user).first()
        if not auth_user.is_active or (utilisateur and not utilisateur.est_actif):
            raise serializers.ValidationError(
                {"email": self.error_messages["inactive_account"]}
            )

        attrs["auth_user"] = auth_user
        attrs["utilisateur"] = utilisateur
        return attrs

    def save(self, **kwargs):
        auth_user = self.validated_data["auth_user"]
        auth_user.set_password(self.validated_data["password"])
        auth_user.save(update_fields=["password"])
        return auth_user
