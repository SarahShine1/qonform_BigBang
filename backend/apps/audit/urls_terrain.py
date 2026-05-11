from django.urls import path
from .views_terrain import (
    AuditTerrainDetailView,
    AuditTerrainListCreateView,
    DepartementListView,
)

urlpatterns = [
    # Départements pour le select
    path("departements/", DepartementListView.as_view(), name="departement-list"),

    # Audits terrain
    path("terrain/", AuditTerrainListCreateView.as_view(), name="audit-terrain-list"),
    path("terrain/<int:pk>/", AuditTerrainDetailView.as_view(), name="audit-terrain-detail"),
]