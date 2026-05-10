from django.urls import path
from . import views

urlpatterns = [
    path("executions/<str:audit_id>/", views.audit_execution_detail, name="audit-execution-detail"),
    path("executions/<str:audit_id>/draft/", views.save_audit_draft, name="audit-execution-draft"),
    path("executions/<str:audit_id>/complete/", views.complete_audit_execution, name="audit-execution-complete"),
]
