from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


MOCK_AUDIT_EXECUTION = {
    "audit": {
        "id": "AUD-2026-001",
        "code": "AUD-2026-001",
        "processCode": "SUP-IT-003",
        "processName": "Support IT",
        "auditor": "Ahmed Benali",
        "date": "2026-05-13",
        "status": "En cours",
    },
    "message": "Mock backend audit execution payload.",
}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_execution_detail(request, audit_id):
    # TODO(audit-backend): load audit execution, process sheet sections,
    # requirements, evaluations, recommendations and corrective actions from DB.
    return Response({**MOCK_AUDIT_EXECUTION, "audit": {**MOCK_AUDIT_EXECUTION["audit"], "id": audit_id}})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_audit_draft(request, audit_id):
    # TODO(audit-backend): persist section evaluations and draft metadata.
    return Response({"ok": True, "auditId": audit_id, "status": "Brouillon enregistré"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_audit_execution(request, audit_id):
    # TODO(audit-backend): validate the execution, publish it and enable report generation.
    return Response({"ok": True, "auditId": audit_id, "status": "Publié"})
