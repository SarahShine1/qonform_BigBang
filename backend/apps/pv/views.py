from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import PV
from .serializers import PVSerializer


class PVViewSet(viewsets.ModelViewSet):
    queryset = PV.objects.all()
    serializer_class = PVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    filterset_fields = ["type", "date"]
    ordering_fields = ["date", "created_at", "code"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        queryset = PV.objects.all().prefetch_related("participants")

        pv_type = self.request.query_params.get("type")
        if pv_type:
            queryset = queryset.filter(type=pv_type)

        date = self.request.query_params.get("date")
        if date:
            queryset = queryset.filter(date=date)

        return queryset

    @action(detail=False, methods=["get"])
    def by_type(self, request):
        pv_type = request.query_params.get("type")

        if not pv_type:
            return Response(
                {"error": "type parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pv_type not in dict(PV.PV_TYPES):
            return Response(
                {"error": f"Invalid type. Choices: {', '.join(dict(PV.PV_TYPES).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pvs = self.get_queryset().filter(type=pv_type)
        serializer = self.get_serializer(pvs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_date(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date parameters are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pvs = self.get_queryset().filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(pvs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        total_pvs = PV.objects.count()
        pv_by_type = {
            type_choice[0]: PV.objects.filter(type=type_choice[0]).count()
            for type_choice in PV.PV_TYPES
        }
        recent_pvs = list(PV.objects.all()[:5].values("id", "code", "type", "date"))

        return Response(
            {
                "total_pvs": total_pvs,
                "by_type": pv_by_type,
                "recent_pvs": recent_pvs,
            }
        )

    @action(detail=True, methods=["get"])
    def participants(self, request, pk=None):
        pv = self.get_object()
        participants = pv.participants.values(
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        )
        return Response(
            {
                "pv_code": pv.code,
                "participants_count": pv.participants.count(),
                "participants": list(participants),
            }
        )

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
