from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.pilote_dashboard, name="pilote-dashboard"),
    path("caq/dashboard/", views.caq_dashboard, name="caq-dashboard"),
]