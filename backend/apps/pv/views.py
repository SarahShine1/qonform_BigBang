from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import PV
from .serializers import PVSerializer


class PVViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PV (Procès-Verbal) management.
    
    Provides:
    - List: GET /api/v1/pv/ - List all PVs with filtering
    - Create: POST /api/v1/pv/ - Create new PV with document upload
    - Retrieve: GET /api/v1/pv/{id}/ - Get specific PV
    - Update: PUT /api/v1/pv/{id}/ - Update PV
    - Partial Update: PATCH /api/v1/pv/{id}/ - Partial update PV
    - Delete: DELETE /api/v1/pv/{id}/ - Delete PV
    
    Custom Actions:
    - /api/v1/pv/by-type/{type}/ - Filter PVs by type
    """
    
    queryset = PV.objects.all()
    serializer_class = PVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    filterset_fields = ['type', 'date']
    ordering_fields = ['date', 'created_at', 'code']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        """
        Optionally filter PVs by:
        - type: GET /api/v1/pv/?type=AUDIT
        - date: GET /api/v1/pv/?date=2026-05-11
        """
        # ✅ supprimer 'document'
        queryset = PV.objects.all().prefetch_related('participants')
        
        pv_type = self.request.query_params.get('type')
        if pv_type:
            queryset = queryset.filter(type=pv_type)
        
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Custom action to filter PVs by type.
        Usage: GET /api/v1/pv/by-type/?type=AUDIT
        """
        pv_type = request.query_params.get('type')
        
        if not pv_type:
            return Response(
                {'error': 'type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if pv_type not in dict(PV.PV_TYPES):
            return Response(
                {'error': f'Invalid type. Choices: {", ".join(dict(PV.PV_TYPES).keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pvs = self.get_queryset().filter(type=pv_type)
        serializer = self.get_serializer(pvs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """
        Custom action to filter PVs by date range.
        Usage: GET /api/v1/pv/by-date/?start_date=2026-05-01&end_date=2026-05-31
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pvs = self.get_queryset().filter(date__range=[start_date, end_date])
        serializer = self.get_serializer(pvs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Custom action to get PV statistics.
        Usage: GET /api/v1/pv/statistics/
        """
        total_pvs = PV.objects.count()
        pv_by_type = {
            type_choice[0]: PV.objects.filter(type=type_choice[0]).count()
            for type_choice in PV.PV_TYPES
        }
        recent_pvs = PV.objects.all()[:5].values('id', 'code', 'type', 'date')
        
        return Response({
            'total_pvs': total_pvs,
            'by_type': pv_by_type,
            'recent_pvs': list(recent_pvs),
        })
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """
        Get participants for a specific PV.
        Usage: GET /api/v1/pv/{id}/participants/
        """
        pv = self.get_object()
        participants = pv.participants.values(
            'id', 'username', 'email', 'first_name', 'last_name'
        )
        return Response({
            'pv_code': pv.code,
            'participants_count': pv.participants.count(),
            'participants': list(participants),
        })
    
    def perform_create(self, serializer):
        """Create PV with automatic code generation."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Update PV."""
        serializer.save()
