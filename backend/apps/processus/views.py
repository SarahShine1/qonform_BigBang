import re

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Processus, ProcessusExterne
from .serializers import (
    TYPE_LABELS,
    ProcessInteractionSerializer,
    ProcessusSerializer,
    ProcessusExterneSerializer,
)
from apps.accounts.models import Departement, Utilisateur
from apps.fiches.models import ProcessusLiaison, VersionFiche
from apps.organigramme.models import OrganizationUnit
from apps.organigramme.serializers import unpack_unit_metadata
from apps.organigramme.services import sync_departements_from_organigramme


TYPE_CODE_MAP = {
    "Management": "MNG",
    "Realisation": "REA",
    "Support": "SUP",
}


def _next_process_code(departement_id, type_process):
    departement = Departement.objects.filter(id_departement=departement_id).first()
    organization_unit = OrganizationUnit.objects.filter(pk=departement_id, is_active=True).first()
    metadata = unpack_unit_metadata(getattr(organization_unit, "description", ""))
    department_code = (
        metadata.get("displayCode")
        or getattr(departement, "code", "")
        or getattr(organization_unit, "code", "")
        or f"DEP{departement_id}"
    )
    type_code = TYPE_CODE_MAP.get(type_process, "GEN")
    prefix = f"{department_code}-{type_code}-"

    matching_codes = Processus.objects.filter(
        id_departement=departement_id,
        type_process=type_process,
    ).values_list("code_process", flat=True)

    next_number = 1
    for code in matching_codes:
        normalized_code = str(code or "").strip()
        match = re.search(rf"^{re.escape(prefix)}(\d+)$", normalized_code)
        if not match:
            match = re.search(r"(\d+)$", normalized_code)
        if match:
            next_number = max(next_number, int(match.group(1)) + 1)

    return f"{prefix}{next_number:03d}"


class ProcessusViewSet(viewsets.ModelViewSet):
    """
    GET /api/v1/processus/       – liste des processus
    GET /api/v1/processus/{id}/  – détail d'un processus
    """

    serializer_class = ProcessusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Processus.objects.all()
        dept = self.request.query_params.get("departement")
        if dept:
            qs = qs.filter(id_departement=dept)
        return qs.order_by("nom")

    def create(self, request, *args, **kwargs):
        sync_departements_from_organigramme()
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        departement_id = serializer.validated_data["id_departement"]
        type_process = serializer.validated_data.get("type_process") or "Support"
        serializer.save(
            code_process=serializer.validated_data.get("code_process") or _next_process_code(departement_id, type_process),
            type_process=type_process,
        )


def _effective_version_date(version):
    return version["date_derniere_modif"] or version["date_creation"]


def _is_better_version(candidate, current):
    candidate_published = candidate["statut"] == "Publiee"
    current_published = current["statut"] == "Publiee"

    if candidate_published != current_published:
        return candidate_published

    candidate_date = _effective_version_date(candidate)
    current_date = _effective_version_date(current)

    if candidate_date != current_date:
        return candidate_date > current_date

    return candidate["id_version"] > current["id_version"]


def _serialize_process_ref(process):
    return {
        "id": process.id_processus,
        "code": process.code_process,
        "name": process.nom,
        "type": process.type_process,
    }


class ProcessusExterneViewSet(viewsets.ViewSet):
    """
    GET  /api/v1/processus/externes/  – liste tous les processus externes
    POST /api/v1/processus/externes/  – crée ou retourne un processus externe existant
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        qs = ProcessusExterne.objects.all()
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(nom__icontains=search)
        return Response(ProcessusExterneSerializer(qs, many=True).data)

    def create(self, request):
        nom = (request.data.get("nom") or "").strip()
        if not nom:
            return Response({"detail": "Le champ 'nom' est requis."}, status=400)
        externe, _ = ProcessusExterne.objects.get_or_create(nom=nom)
        return Response(ProcessusExterneSerializer(externe).data, status=201)


class ProcessInteractionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        process_queryset = Processus.objects.all().order_by("nom")

        dept = request.query_params.get("departement")
        if dept:
            process_queryset = process_queryset.filter(id_departement=dept)

        process_list = list(process_queryset)
        if not process_list:
            return Response([])

        process_ids = [process.id_processus for process in process_list]
        process_map = {process.id_processus: process for process in process_list}

        pilote_ids = {process.id_pilote for process in process_list if process.id_pilote}
        department_ids = {
            process.id_departement for process in process_list if process.id_departement
        }

        pilotes = {
            user["id_user"]: f'{user["prenom"]} {user["nom"]}'.strip()
            for user in Utilisateur.objects.filter(id_user__in=pilote_ids).values(
                "id_user", "prenom", "nom"
            )
        }
        departments = {
            department["id_departement"]: department["nom"]
            for department in Departement.objects.filter(
                id_departement__in=department_ids
            ).values("id_departement", "nom")
        }

        version_rows = VersionFiche.objects.filter(
            id_processus__in=process_ids
        ).values(
            "id_version",
            "id_processus",
            "numero_version",
            "statut",
            "date_creation",
            "date_derniere_modif",
        )

        best_versions = {}
        for version in version_rows:
            process_id = version["id_processus"]
            current = best_versions.get(process_id)
            if current is None or _is_better_version(version, current):
                best_versions[process_id] = version

        upstream_map = {process_id: set() for process_id in process_ids}
        downstream_map = {process_id: set() for process_id in process_ids}

        liaison_rows = ProcessusLiaison.objects.filter(
            Q(id_processus_amont__in=process_ids)
            | Q(id_processus_aval__in=process_ids)
        ).values("id_processus_amont", "id_processus_aval")

        for liaison in liaison_rows:
            upstream_id = liaison["id_processus_amont"]
            downstream_id = liaison["id_processus_aval"]

            if upstream_id not in process_map or downstream_id not in process_map:
                continue

            if upstream_id == downstream_id:
                continue

            downstream_map[upstream_id].add(downstream_id)
            upstream_map[downstream_id].add(upstream_id)

        response_data = []
        for process in process_list:
            version = best_versions.get(process.id_processus)

            upstream_ids = sorted(
                upstream_map[process.id_processus],
                key=lambda related_id: process_map[related_id].nom.lower(),
            )
            downstream_ids = sorted(
                downstream_map[process.id_processus],
                key=lambda related_id: process_map[related_id].nom.lower(),
            )

            upstream = [
                _serialize_process_ref(process_map[related_id]) for related_id in upstream_ids
            ]
            downstream = [
                _serialize_process_ref(process_map[related_id]) for related_id in downstream_ids
            ]

            inputs = [f"Sortie de {item['name']}" for item in upstream]
            outputs = [f"Entree vers {item['name']}" for item in downstream]

            response_data.append(
                {
                    "id": process.id_processus,
                    "code": process.code_process,
                    "name": process.nom,
                    "description": process.description or "",
                    "type": process.type_process,
                    "typeLabel": TYPE_LABELS.get(process.type_process, process.type_process),
                    "responsable": pilotes.get(process.id_pilote, ""),
                    "department": departments.get(process.id_departement, ""),
                    "upstream": upstream,
                    "downstream": downstream,
                    "inputs": inputs,
                    "outputs": outputs,
                    "version": (
                        {
                            "id": version["id_version"],
                            "numero": version["numero_version"],
                            "statut": version["statut"],
                        }
                        if version
                        else None
                    ),
                }
            )

        serializer = ProcessInteractionSerializer(response_data, many=True)
        return Response(serializer.data)
