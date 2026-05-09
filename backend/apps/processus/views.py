from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Processus
from .serializers import ProcessusSerializer


class ProcessusViewSet(viewsets.ReadOnlyModelViewSet):
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
