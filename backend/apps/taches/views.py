from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import TachePlanifiee
from .serializers import TachePlanifieeSerializer


class TachePlanifieeViewSet(viewsets.ModelViewSet):
    queryset = TachePlanifiee.objects.all()
    serializer_class = TachePlanifieeSerializer
    permission_classes = [AllowAny]