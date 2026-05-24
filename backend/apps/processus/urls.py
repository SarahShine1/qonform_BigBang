from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProcessInteractionsAPIView, ProcessusViewSet, ProcessusExterneViewSet

router = DefaultRouter()
router.register(r"", ProcessusViewSet, basename="processus")

externe_list   = ProcessusExterneViewSet.as_view({"get": "list", "post": "create"})

urlpatterns = [
    path("interactions/", ProcessInteractionsAPIView.as_view(), name="processus-interactions"),
    path("externes/", externe_list, name="processus-externes"),
    path("", include(router.urls)),
]
