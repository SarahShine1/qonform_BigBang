import logging
import socket

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Departement, Role, Utilisateur, UtilisateurSettings
from .permissions import HasRole
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    DepartementSerializer,
    ManagedUserSerializer,
    ManagedUserWriteSerializer,
    ProfilePhotoUploadSerializer,
    RoleSerializer,
    UserPreferencesSerializer,
    UserProfileUpdateSerializer,
    UserSettingsSerializer,
    build_user_preferences,
)
from .utils import (
    delete_profile_photo_from_storage,
    get_active_role_labels_for_user,
    get_auth_user_for_utilisateur,
    get_profile_photo_url,
    profile_storage_is_configured,
    upload_profile_photo_to_storage,
)
from .utils import (
    get_active_role_labels_for_user,
    get_auth_user_for_utilisateur,
    send_user_invitation_email,
)

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload = request.auth.payload
        email = payload.get("email")
        roles = payload.get("roles", [])
        departement_id = payload.get("departement_id")

        utilisateur = Utilisateur.objects.get(email=email)
        settings_obj = UtilisateurSettings.objects.filter(utilisateur=utilisateur).first()

        return Response(
            {
                "id_user": utilisateur.id_user,
                "nom": utilisateur.nom,
                "prenom": utilisateur.prenom,
                "email": email,
                "roles": roles,
                "departement": departement_id,
                "photo_profil": get_profile_photo_url(
                    settings_obj.photo_profil if settings_obj else None,
                    request=request,
                ),
            }
        )


def get_current_utilisateur(user):
    utilisateur = Utilisateur.objects.filter(auth=user).first()

    if not utilisateur:
        utilisateur = Utilisateur.objects.filter(email__iexact=user.email).first()

    if not utilisateur:
        raise NotFound("Profil utilisateur introuvable.")

    return utilisateur


def get_or_create_user_settings(utilisateur):
    settings_obj, _ = UtilisateurSettings.objects.get_or_create(
        utilisateur=utilisateur,
        defaults={"preferences": build_user_preferences()},
    )
    return settings_obj


class ManagedUserListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAuthenticated(), HasRole("CAQ", "ADMIN", "Admin")()]

    def get(self, request):
        search = str(request.query_params.get("search", "") or "").strip()
        departement = request.query_params.get("departement")
        statut = str(request.query_params.get("statut", "") or "").strip().lower()
        role = str(request.query_params.get("role", "") or "").strip().upper()

        queryset = Utilisateur.objects.all().order_by("nom", "prenom", "id_user")

        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search)
                | Q(prenom__icontains=search)
                | Q(email__icontains=search)
            )

        if departement not in (None, ""):
            queryset = queryset.filter(id_departement=departement)

        if statut == "actif":
            queryset = queryset.filter(est_actif=True)
        elif statut in {"desactive", "disabled", "inactive"}:
            queryset = queryset.filter(est_actif=False)

        users = list(queryset)

        if role:
            users = [
                user
                for user in users
                if role
                in {
                    label.upper()
                    for label in get_active_role_labels_for_user(user.id_user)
                }
            ]

        return Response(ManagedUserSerializer(users, many=True).data)

    def post(self, request):
        serializer = ManagedUserWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        if getattr(serializer, "send_invitation_requested", False):
            try:
                send_user_invitation_email(
                    utilisateur,
                    serializer.temporary_password,
                )
            except Exception as exc:
                logger.exception(
                    "Invitation email failed after user creation for %s",
                    utilisateur.email,
                )
                detail = "Utilisateur créé, mais l’email n’a pas pu être envoyé."
                if isinstance(exc, (TimeoutError, socket.timeout)):
                    detail = (
                        "Utilisateur créé, mais l’email n’a pas pu être envoyé. "
                        "Impossible de joindre le serveur SMTP."
                    )
                # Keep the created user to avoid duplicate creation on retry.
                return Response(
                    {
                        "detail": detail,
                        "email_sent": False,
                        "user": ManagedUserSerializer(utilisateur).data,
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                **ManagedUserSerializer(utilisateur).data,
                "detail": "Utilisateur créé avec succès.",
                "email_sent": getattr(serializer, "send_invitation_requested", False),
            },
            status=status.HTTP_201_CREATED,
        )


class ManagedUserDetailView(APIView):
    permission_classes = [IsAuthenticated, HasRole("CAQ", "ADMIN", "Admin")]

    def get_object(self, user_id):
        return get_object_or_404(Utilisateur, pk=user_id)

    def get(self, request, user_id):
        utilisateur = self.get_object(user_id)
        return Response(ManagedUserSerializer(utilisateur).data)

    @transaction.atomic
    def patch(self, request, user_id):
        utilisateur = self.get_object(user_id)
        serializer = ManagedUserWriteSerializer(
            utilisateur,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(ManagedUserSerializer(utilisateur).data)

    @transaction.atomic
    def delete(self, request, user_id):
        utilisateur = self.get_object(user_id)
        utilisateur.est_actif = False
        utilisateur.save(update_fields=["est_actif"])

        auth_user = get_auth_user_for_utilisateur(utilisateur)

        if auth_user:
            auth_user.is_active = False
            auth_user.save(update_fields=["is_active"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class RoleListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = list(Role.objects.all().order_by("libelle"))
        has_dg_role = any(
            str(role.libelle or "").strip().upper() == "DG"
            for role in roles
        )

        if not has_dg_role:
            roles.append(Role(libelle="DG"))
            roles.sort(key=lambda role: str(role.libelle or "").lower())

        return Response(RoleSerializer(roles, many=True).data)


class DepartementListView(APIView):
    permission_classes = [IsAuthenticated, HasRole("CAQ", "ADMIN", "Admin")]

    def get(self, request):
        departments = Departement.objects.all().order_by("nom")
        return Response(DepartementSerializer(departments, many=True).data)


class ManagedUserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            "activeUsers": 0,
            "pilotes": 0,
            "auditeurs": 0,
            "disabledUsers": 0,
        }

        for user in Utilisateur.objects.all():
            role_labels = {
                label.upper()
                for label in get_active_role_labels_for_user(user.id_user)
            }

            if user.est_actif:
                stats["activeUsers"] += 1
            else:
                stats["disabledUsers"] += 1

            if "PILOTE" in role_labels or "PILOTE DE PROCESSUS" in role_labels:
                stats["pilotes"] += 1

            if "AUDITEUR" in role_labels or "AUDITEUR INTERNE" in role_labels:
                stats["auditeurs"] += 1

        return Response(stats)


class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        utilisateur = get_current_utilisateur(request.user)
        serializer = UserSettingsSerializer(utilisateur, context={"request": request})
        return Response(serializer.data)

    @transaction.atomic
    def patch(self, request):
        utilisateur = get_current_utilisateur(request.user)
        serializer = UserProfileUpdateSerializer(
            utilisateur,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(
            UserSettingsSerializer(utilisateur, context={"request": request}).data
        )


class ProfilePhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        utilisateur = get_current_utilisateur(request.user)
        serializer = ProfilePhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        settings_obj = get_or_create_user_settings(utilisateur)
        previous_photo_name = settings_obj.photo_profil.name if settings_obj.photo_profil else ""
        uploaded_photo = serializer.validated_data["photo"]

        if profile_storage_is_configured():
            storage_path = upload_profile_photo_to_storage(uploaded_photo, utilisateur.id_user)
            settings_obj.photo_profil.name = storage_path
            settings_obj.save(update_fields=["photo_profil"])

            if previous_photo_name and previous_photo_name != storage_path:
                try:
                    delete_profile_photo_from_storage(previous_photo_name)
                except Exception:
                    pass
        else:
            settings_obj.photo_profil = uploaded_photo
            settings_obj.save(update_fields=["photo_profil"])

            if previous_photo_name and previous_photo_name != settings_obj.photo_profil.name:
                settings_obj.photo_profil.storage.delete(previous_photo_name)

        photo_url = get_profile_photo_url(settings_obj.photo_profil, request=request)

        return Response(
            {
                "photo_profil": photo_url,
                "message": "La photo de profil a ete mise a jour avec succes.",
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])

        return Response(
            {"message": "Le mot de passe a ete modifie avec succes."},
            status=status.HTTP_200_OK,
        )


class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request):
        utilisateur = get_current_utilisateur(request.user)
        settings_obj = get_or_create_user_settings(utilisateur)

        serializer = UserPreferencesSerializer(
            settings_obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        settings_obj.preferences = serializer.validated_data["preferences"]
        settings_obj.save(update_fields=["preferences"])

        return Response(
            {
                "preferences": build_user_preferences(settings_obj.preferences),
                "message": "Les preferences ont ete enregistrees avec succes.",
            },
            status=status.HTTP_200_OK,
        )
