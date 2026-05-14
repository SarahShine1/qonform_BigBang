from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.pilote_dashboard, name="pilote-dashboard"),
    path("dashboard-dg/", views.dg_dashboard, name="dg-dashboard"),

]