from django.db.models import Q, TextField
from django.db.models.functions import Cast
from rest_framework import status, viewsets
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import request_has_role
from apps.accounts.models import Utilisateur

from .models import DictionaryTerm, normalize_term
from .serializers import DictionaryTermSerializer


DICTIONARY_MANAGER_ROLES = (
    "Chef cellule qualit\u00e9",
    "Chef cellule qualite",
    "CAQ",
    "Auditeur interne",
    "Auditeur",
    "Admin",
    "ADMIN",
)


def get_profile_for_auth_user(auth_user):
    try:
        profile = getattr(auth_user, "utilisateur", None)
    except Exception:
        profile = None

    if profile:
        return profile

    email = str(getattr(auth_user, "email", "") or "").strip()
    if not email:
        return None

    return (
        Utilisateur.objects.filter(auth=auth_user).first()
        or Utilisateur.objects.filter(email__iexact=email).first()
    )


class CanManageDictionary(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request_has_role(request, *DICTIONARY_MANAGER_ROLES)


class DictionaryTermViewSet(viewsets.ModelViewSet):
    serializer_class = DictionaryTermSerializer
    permission_classes = [IsAuthenticated, CanManageDictionary]
    pagination_class = None

    def get_queryset(self):
        queryset = (
            DictionaryTerm.objects.filter(is_active=True)
            .select_related("created_by", "updated_by")
            .order_by("term", "id")
        )

        search = str(self.request.query_params.get("search", "") or "").strip()
        if not search:
            return queryset

        normalized_search = normalize_term(search)
        return queryset.annotate(
            synonyms_text=Cast("synonyms", output_field=TextField())
        ).filter(
            Q(term__icontains=search)
            | Q(normalized_term__icontains=normalized_search)
            | Q(definition__icontains=search)
            | Q(category__icontains=search)
            | Q(synonyms_text__icontains=search)
        )

    def perform_create(self, serializer):
        profile = get_profile_for_auth_user(self.request.user)
        serializer.save(created_by=profile, updated_by=profile)

    def perform_update(self, serializer):
        serializer.save(updated_by=get_profile_for_auth_user(self.request.user))

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.updated_by = get_profile_for_auth_user(request.user)
        instance.save(update_fields=["is_active", "updated_by", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
