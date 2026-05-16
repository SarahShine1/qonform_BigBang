from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import Utilisateur
from .models import Notification
from .serializers import NotificationSerializer


def get_current_utilisateur(request):
    return Utilisateur.objects.filter(email=request.user.email).first()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mes_notifications(request):
    utilisateur = get_current_utilisateur(request)

    if not utilisateur:
        return Response([])

    notifications = Notification.objects.filter(destinataire=utilisateur)
    return Response(NotificationSerializer(notifications, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def marquer_lue(request, pk):
    utilisateur = get_current_utilisateur(request)

    notification = Notification.objects.filter(
        id_notification=pk,
        destinataire=utilisateur,
    ).first()

    if not notification:
        return Response({"detail": "Notification introuvable."}, status=404)

    notification.lu = True
    notification.save(update_fields=["lu"])

    return Response({"success": True})