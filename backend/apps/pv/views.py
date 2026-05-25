from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import PV, PVValidation
from .serializers import PVSerializer, DecisionSerializer
from apps.notifications.utils import (
    notifier_participants_pv_soumission,
    notifier_createur_pv_rejet,
    notifier_createur_pv_valide,
    notifier_participants_pv_rejet,
    notifier_participants_pv_valide,
)


class PVViewSet(viewsets.ModelViewSet):
    queryset = PV.objects.all()
    serializer_class = PVSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    filterset_fields = ['categorie', 'sous_type', 'statut', 'date']
    ordering_fields = ['date', 'created_at', 'code']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        queryset = PV.objects.all().prefetch_related('participants', 'validations')

        for param in ['categorie', 'sous_type', 'statut']:
            val = self.request.query_params.get(param)
            if val:
                queryset = queryset.filter(**{param: val})

        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        queryset = queryset.filter(
            Q(statut='VALIDE') |
            Q(statut__in=['EN_VALIDATION', 'REJETE'], participants=user) |
            Q(statut__in=['EN_VALIDATION', 'REJETE'], createur=user)  # ← simple
        ).distinct()

        return queryset


    # ------------------------------------------------------------------ #
    #  Action : décision (valider ou rejeter)                              #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['post'])
    def decision(self, request, pk=None):
        pv = self.get_object()

        if not pv.participants.filter(id=request.user.id).exists():
            return Response({'error': "Vous n'êtes pas participant de ce PV."}, status=403)

        validation = PVValidation.objects.filter(pv=pv, utilisateur=request.user).first()
        if not validation:
            return Response({'error': "Aucune validation en attente pour vous sur ce PV."}, status=400)
        if validation.decision is not None:
            return Response({'error': "Vous avez déjà enregistré votre décision."}, status=400)

        serializer = DecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resultat = pv.enregistrer_decision(
            user=request.user,
            decision=serializer.validated_data['decision'],
            motif=serializer.validated_data.get('motif'),
        )

        if resultat == 'REJETE':
            notifier_createur_pv_rejet(pv, request.user, serializer.validated_data['motif'])
            # notifier aussi les autres participants
            notifier_participants_pv_rejet(pv, request.user)
        elif resultat == 'VALIDE':
            notifier_createur_pv_valide(pv)
            notifier_participants_pv_valide(pv)

        return Response(self.get_serializer(pv).data)


    # ------------------------------------------------------------------ #
    #  Action : statut validation (temps réel via polling)                 #
    # ------------------------------------------------------------------ #

    @action(detail=True, methods=['get'])
    def statut_validation(self, request, pk=None):
        """
        GET /api/v1/pv/{id}/statut_validation/
        Retourne la progression des validations pour le front.
        """
        pv = self.get_object()

        if not pv.is_pv:
            return Response(
                {'error': "Les Comptes Rendus n'ont pas de workflow de validation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validations = pv.validations.select_related('utilisateur').all()
        from .serializers import PVValidationDetailSerializer
        return Response({
            'pv_code': pv.code,
            'statut': pv.statut,
            'total': pv.total_participants,
            'approuves': pv.nb_approuves,
            'rejetes': pv.nb_rejetes,
            'en_attente': pv.nb_en_attente,
            'detail': PVValidationDetailSerializer(validations, many=True).data,
        })
    
    @action(detail=True, methods=['delete'])
    def supprimer(self, request, pk=None):
        pv = self.get_object()
        if pv.statut != 'REJETE':
            return Response({'error': "Seul un PV rejeté peut être supprimé."}, status=400)
        # Si vous avez un champ createur : if pv.createur != request.user: 403
        pv.delete()
        return Response(status=204)

    # ------------------------------------------------------------------ #
    #  Actions existantes                                                  #
    # ------------------------------------------------------------------ #

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total = PV.objects.count()
        by_categorie = {c: PV.objects.filter(categorie=c).count() for c, _ in PV.CATEGORIE_CHOICES}
        by_statut = {s: PV.objects.filter(statut=s).count() for s, _ in PV.STATUT_CHOICES}
        return Response({
            'total': total,
            'by_categorie': by_categorie,
            'by_statut': by_statut,
        })

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()