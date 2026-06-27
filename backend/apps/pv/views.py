from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.notifications.utils import (
    notifier_createur_pv_rejet,
    notifier_createur_pv_valide,
    notifier_participants_pv_rejet,
    notifier_participants_pv_valide,
)

from .models import PV, PVValidation
from .serializers import DecisionSerializer, PVSerializer, PVValidationDetailSerializer


class PVViewSet(viewsets.ModelViewSet):
    queryset = PV.objects.all()
    serializer_class = PVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    filterset_fields = ["categorie", "sous_type", "statut", "date"]
    ordering_fields = ["date", "created_at", "code"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        queryset = PV.objects.all().prefetch_related("participants", "validations")

        categorie = self.request.query_params.get("categorie")
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        sous_type = self.request.query_params.get("sous_type") or self.request.query_params.get("type")
        if sous_type:
            queryset = queryset.filter(sous_type=sous_type)

        statut = self.request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)

        date = self.request.query_params.get("date")
        if date:
            queryset = queryset.filter(date=date)

        return queryset.filter(
            Q(statut="VALIDE")
            | Q(statut__in=["EN_VALIDATION", "REJETE"], participants=user)
            | Q(statut__in=["EN_VALIDATION", "REJETE"], createur=user)
        ).distinct()

    @action(detail=True, methods=["post"])
    def decision(self, request, pk=None):
        pv = self.get_object()

        if not pv.participants.filter(id=request.user.id).exists():
            return Response({"error": "Vous n'etes pas participant de ce PV."}, status=403)

        validation = PVValidation.objects.filter(pv=pv, utilisateur=request.user).first()
        if not validation:
            return Response({"error": "Aucune validation en attente pour vous sur ce PV."}, status=400)
        if validation.decision is not None:
            return Response({"error": "Vous avez deja enregistre votre decision."}, status=400)

        serializer = DecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultat = pv.enregistrer_decision(
            user=request.user,
            decision=serializer.validated_data["decision"],
            motif=serializer.validated_data.get("motif"),
        )

        if resultat == "REJETE":
            notifier_createur_pv_rejet(pv, request.user, serializer.validated_data["motif"])
            notifier_participants_pv_rejet(pv, request.user)
        elif resultat == "VALIDE":
            notifier_createur_pv_valide(pv)
            notifier_participants_pv_valide(pv)

        return Response(self.get_serializer(pv).data)

    @action(detail=True, methods=["get"])
    def statut_validation(self, request, pk=None):
        pv = self.get_object()
        if not pv.is_pv:
            return Response(
                {"error": "Les comptes rendus n'ont pas de workflow de validation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validations = pv.validations.select_related("utilisateur").all()
        return Response(
            {
                "pv_code": pv.code,
                "statut": pv.statut,
                "total": pv.total_participants,
                "approuves": pv.nb_approuves,
                "rejetes": pv.nb_rejetes,
                "en_attente": pv.nb_en_attente,
                "detail": PVValidationDetailSerializer(validations, many=True).data,
            }
        )

    @action(detail=True, methods=["delete"])
    def supprimer(self, request, pk=None):
        pv = self.get_object()
        if pv.statut != "REJETE":
            return Response({"error": "Seul un PV rejete peut etre supprime."}, status=400)
        if pv.createur_id and pv.createur_id != request.user.id:
            return Response({"error": "Vous n'etes pas autorise a supprimer ce PV."}, status=403)
        pv.delete()
        return Response(status=204)

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        queryset = self.get_queryset()
        by_categorie = {
            code: queryset.filter(categorie=code).count() for code, _ in PV.CATEGORIE_CHOICES
        }
        by_statut = {code: queryset.filter(statut=code).count() for code, _ in PV.STATUT_CHOICES}
        by_sous_type = {
            code: queryset.filter(sous_type=code).count() for code, _ in PV.SOUS_TYPE_CHOICES
        }
        recent_pvs = list(
            queryset.order_by("-date", "-created_at").values(
                "id", "code", "categorie", "sous_type", "statut", "date"
            )[:5]
        )
        return Response(
            {
                "total": queryset.count(),
                "by_categorie": by_categorie,
                "by_statut": by_statut,
                "by_sous_type": by_sous_type,
                "recent_pvs": recent_pvs,
            }
        )

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()
