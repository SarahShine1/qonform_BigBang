from django.urls import path, include
from . import views

urlpatterns = [
    path("dashboard/", views.audit_dashboard, name="audit-dashboard"),
    path("fiches/", views.fiches_audit_list, name="audit-fiches-list"),
    path("fiches/<int:id_version>/", views.fiche_audit_detail, name="audit-fiche-detail"),
    path("fiches/<int:id_version>/start/", views.start_audit_execution, name="audit-fiche-start"),
    path("fiches/<int:id_version>/report/", views.fiche_audit_report, name="audit-fiche-report"),
    path("fiches/<int:id_version>/draft/", views.save_audit_draft, name="audit-fiche-draft"),
    path("fiches/<int:id_version>/complete/", views.complete_audit_execution, name="audit-fiche-complete"),
    path("fiches/<int:id_version>/nc/", views.create_nc, name="audit-fiche-nc-create"),
    path("criteres/sections/<int:id_section>/", views.criteres_by_section, name="audit-criteres-section"),
    path("nc/<int:id_nc>/actions-correctives/", views.create_action_corrective, name="audit-nc-action-create"),

    path("", include("apps.audit.urls_terrain")),
]
