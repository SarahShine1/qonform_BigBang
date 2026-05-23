from rest_framework import serializers
from django.utils import timezone
from django.core.files.storage import default_storage
from django.contrib.auth import get_user_model
from apps.accounts.models import Utilisateur
from apps.documents.models import Document
from .models import PV
from apps.notifications.utils import notifier_participants_pv

User = get_user_model()


class PVSerializer(serializers.ModelSerializer):

    participants = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(),
        many=True,
        required=True,
    )

    fichier = serializers.FileField(
        write_only=True,
        required=True,
    )

    code = serializers.CharField(read_only=True)
    document_data = serializers.SerializerMethodField(read_only=True)  # ✅ renommé
    participants_data = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PV
        fields = [
            'id',
            'code',
            'type',
            'date',
            'participants',
            'participants_data',
            'document_data',  # ✅ renommé
            'fichier',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'code', 'created_at', 'updated_at']

    def get_document_data(self, obj):
        """Récupérer le document lié via id_pv."""
        # ✅ on cherche dans Document par id_pv
        document = Document.objects.filter(id_pv=obj.id).first()
        if document:
            return {
                'id': document.id_document,
                'nom_fichier': document.nom_fichier,
                'chemin_stockage': document.chemin_stockage,
                'date_upload': document.date_upload,
                'taille': document.taille,
            }
        return None

    def get_participants_data(self, obj):
        participants_data = []
        for user in obj.participants.all():
            # Retrouver l'Utilisateur correspondant
            try:
                utilisateur = Utilisateur.objects.get(auth_id=user.id)
                participants_data.append({
                    'id': utilisateur.id_user,        # ← id_user de Utilisateur
                    'nom': utilisateur.nom,
                    'prenom': utilisateur.prenom,
                    'email': utilisateur.email,
                })
            except Utilisateur.DoesNotExist:
                # Fallback si l'Utilisateur n'existe pas
                participants_data.append({
                    'id': user.id,
                    'nom': user.last_name,
                    'prenom': user.first_name,
                    'email': user.email,
                })
        return participants_data

    def validate(self, attrs):
        if not attrs.get('participants'):
            raise serializers.ValidationError(
                {'participants': 'At least one participant is required.'}
            )
        if not attrs.get('fichier'):
            raise serializers.ValidationError(
                {'fichier': 'A PDF file is required.'}
            )
        return attrs

    def create(self, validated_data):
        participants_utilisateurs = validated_data.pop('participants', [])
        fichier = validated_data.pop('fichier')

        request = self.context.get('request')
        current_user = request.user if request else None

        if not current_user or not current_user.is_authenticated:
            raise serializers.ValidationError(
                {'detail': 'Authentication required.'}
            )

        try:
            # ✅ Convertir les IDs de Utilisateur en User objects
            participants_users = []
            for utilisateur in participants_utilisateurs:
                if utilisateur.auth_id:  # Vérifier que l'utilisateur a un auth lié
                    participants_users.append(utilisateur.auth)
            
            # ✅ Créer le PV d'abord
            pv = PV.objects.create(**validated_data)
            pv.participants.set(participants_users)

            # ✅ Créer le Document ensuite avec id_pv
            file_name = fichier.name
            file_path = f"pv/{timezone.now().strftime('%Y/%m/%d')}/{file_name}"
            stored_path = default_storage.save(file_path, fichier)

            # Convertir User en Utilisateur
            utilisateur_current = Utilisateur.objects.filter(auth_id=current_user.id).first()
            if not utilisateur_current:
                raise serializers.ValidationError(
                    {'detail': f"Profil introuvable pour auth_id={current_user.id} — vérifie la table Utilisateur."}
                )

            Document.objects.create(
                id_uploader=utilisateur_current.id_user,
                nom_fichier=file_name,
                type_document='PV',          # ✅ type PV
                chemin_stockage=stored_path,
                taille=fichier.size,
                description=f"Document PV {pv.code}",
                type_support='PDF',
                id_pv=pv.id,                 # ✅ lien vers le PV
            )

            # ✅ Notifier les participants
            notifier_participants_pv(pv)

            return pv

        except Exception as e:
            import traceback
            print(traceback.format_exc())
            if 'pv' in locals():
                try:
                    pv.delete()
                except:
                    pass
            raise serializers.ValidationError(
                {'detail': f'Error creating PV: {str(e)}'}
            )

    def update(self, instance, validated_data):
        validated_data.pop('participants', None)
        validated_data.pop('fichier', None)

        instance.date = validated_data.get('date', instance.date)

        if 'participants' in validated_data:
            instance.participants.set(validated_data['participants'])

        instance.save()
        return instance