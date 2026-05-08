from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProcessusViewSet

router = DefaultRouter()
router.register(r"", ProcessusViewSet, basename="processus")

urlpatterns = [
    path("", include(router.urls)),
]
