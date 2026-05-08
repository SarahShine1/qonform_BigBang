from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EmployeeListView, OrganizationUnitViewSet


router = DefaultRouter()
router.register('units', OrganizationUnitViewSet, basename='organization-unit')

urlpatterns = [
    path('', include(router.urls)),
    path('tree/', OrganizationUnitViewSet.as_view({'get': 'tree'}), name='organigramme-tree'),
    path('employees/', EmployeeListView.as_view(), name='organigramme-employees'),
]
