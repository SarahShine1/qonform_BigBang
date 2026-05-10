from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProcessInteractionsAPIView, ProcessusViewSet

router = DefaultRouter()
router.register(r"", ProcessusViewSet, basename="processus")

urlpatterns = [
    path("interactions/", ProcessInteractionsAPIView.as_view(), name="processus-interactions"),
    path("", include(router.urls)),
]
