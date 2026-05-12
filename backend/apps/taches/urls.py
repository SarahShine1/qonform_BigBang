from django.urls import path
from .views import TachePlanifieeViewSet

tache_list = TachePlanifieeViewSet.as_view({
    "get": "list",
    "post": "create",
})

tache_detail = TachePlanifieeViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

urlpatterns = [
    path("", tache_list, name="tache-list"),
    path("<int:pk>/", tache_detail, name="tache-detail"),
]