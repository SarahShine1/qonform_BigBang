from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Utilisateur
from apps.accounts.permissions import HasRole

from .models import OrganizationUnit
from .serializers import (
    EmployeeSerializer,
    OrganizationTreeSerializer,
    OrganizationUnitSerializer,
    generate_unit_code,
    get_user_profile,
)
from .services import sync_departements_from_organigramme


class OrganizationUnitViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationUnitSerializer

    def get_queryset(self):
        queryset = OrganizationUnit.objects.filter(is_active=True)
        parent_id = self.request.query_params.get("parentId")
        unit_type = self.request.query_params.get("type")
        search = self.request.query_params.get("search")

        if parent_id is not None:
            queryset = queryset.filter(parent_id=parent_id or None)

        if unit_type:
            queryset = queryset.filter(type=unit_type)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by("level", "code", "name")

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]

        return [IsAuthenticated(), HasRole("CAQ", "ADMIN", "Admin")()]

    def perform_create(self, serializer):
        parent_id = serializer.validated_data.get("parent_id")
        parent = (
            OrganizationUnit.objects.filter(pk=parent_id).first()
            if parent_id
            else None
        )

        unit_type = serializer.validated_data["type"]
        profile = get_user_profile(self.request.user)

        serializer.save(
            code=generate_unit_code(unit_type),
            level=(parent.level + 1) if parent else 1,
            created_by_id=profile.id_user if profile else None,
        )

        sync_departements_from_organigramme()

    def perform_update(self, serializer):
        parent_id = serializer.validated_data.get(
            "parent_id",
            getattr(serializer.instance, "parent_id", None),
        )

        parent = (
            OrganizationUnit.objects.filter(pk=parent_id).first()
            if parent_id
            else None
        )

        serializer.save(level=(parent.level + 1) if parent else 1)

        sync_departements_from_organigramme()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.children.filter(is_active=True).exists():
            return Response(
                {
                    "detail": "Impossible de supprimer une unite qui contient des enfants."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

        sync_departements_from_organigramme()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request):
        roots = (
            OrganizationUnit.objects
            .filter(parent__isnull=True, is_active=True)
            .order_by("level", "code", "name")
        )

        return Response(OrganizationTreeSerializer(roots, many=True).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="sync-departements",
        permission_classes=[IsAuthenticated, HasRole("CAQ", "ADMIN", "Admin")],
    )
    def sync_departements(self, request):
        sync_departements_from_organigramme()

        return Response(
            {
                "detail": "Départements synchronisés depuis l'organigramme."
            },
            status=status.HTTP_200_OK,
        )


class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employees = Utilisateur.objects.all().order_by("nom", "prenom", "id_user")
        return Response(EmployeeSerializer(employees, many=True).data)