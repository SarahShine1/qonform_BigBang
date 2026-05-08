import json

from rest_framework import serializers

from apps.accounts.models import Utilisateur
from apps.accounts.utils import get_active_role_labels_for_user

from .models import OrganizationUnit


TYPE_PREFIXES = {
    OrganizationUnit.UnitType.ROOT: 'ROOT',
    OrganizationUnit.UnitType.DIRECTION: 'DIR',
    OrganizationUnit.UnitType.DEPARTMENT: 'DEPT',
    OrganizationUnit.UnitType.SERVICE: 'SRV',
    OrganizationUnit.UnitType.CELLULE: 'CELL',
}

ORG_METADATA_PREFIX = '__QONFORME_ORG_META__:'


def normalize_role(role):
    return str(role or '').strip().upper()


def get_user_profile(user):
    email = str(getattr(user, 'email', '') or '').strip().lower()
    if email:
        profile = Utilisateur.objects.filter(email__iexact=email).first()
        if profile:
            return profile

    user_id = getattr(user, 'id', None)
    if isinstance(user_id, int):
        return Utilisateur.objects.filter(id_user=user_id).first()

    return None


def generate_unit_code(unit_type):
    prefix = TYPE_PREFIXES.get(unit_type, unit_type[:4].upper())
    last = (
        OrganizationUnit.objects
        .filter(code__startswith=f'{prefix}-')
        .order_by('-code')
        .first()
    )
    next_number = 1
    if last:
        try:
            next_number = int(last.code.rsplit('-', 1)[1]) + 1
        except (IndexError, ValueError):
            next_number = OrganizationUnit.objects.filter(
                code__startswith=f'{prefix}-'
            ).count() + 1
    return f'{prefix}-{next_number:03d}'


def unpack_unit_metadata(raw_description):
    if not raw_description:
        return {
            'description': '',
            'title': '',
            'displayCode': '',
        }

    if not raw_description.startswith(ORG_METADATA_PREFIX):
        return {
            'description': raw_description,
            'title': '',
            'displayCode': '',
        }

    try:
        metadata = json.loads(raw_description[len(ORG_METADATA_PREFIX):])
    except (TypeError, ValueError):
        return {
            'description': raw_description,
            'title': '',
            'displayCode': '',
        }

    return {
        'description': str(metadata.get('description', '') or '').strip(),
        'title': str(metadata.get('title', '') or '').strip(),
        'displayCode': str(metadata.get('displayCode', '') or '').strip(),
    }


def pack_unit_metadata(description='', title='', display_code=''):
    payload = {
        'description': str(description or '').strip(),
        'title': str(title or '').strip(),
        'displayCode': str(display_code or '').strip(),
    }
    if not payload['title'] and not payload['displayCode']:
        return payload['description']
    return f'{ORG_METADATA_PREFIX}{json.dumps(payload, ensure_ascii=True)}'


class OrganizationUnitSerializer(serializers.ModelSerializer):
    parentId = serializers.IntegerField(
        source='parent_id',
        required=False,
        allow_null=True,
    )
    responsableId = serializers.IntegerField(
        source='responsable_id',
        required=False,
        allow_null=True,
    )
    createdBy = serializers.IntegerField(source='created_by_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    childrenCount = serializers.SerializerMethodField()
    responsable = serializers.SerializerMethodField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=120)
    displayCode = serializers.CharField(required=False, allow_blank=True, max_length=20)

    class Meta:
        model = OrganizationUnit
        fields = [
            'id',
            'code',
            'name',
            'type',
            'parentId',
            'level',
            'description',
            'title',
            'displayCode',
            'responsableId',
            'responsable',
            'createdBy',
            'is_active',
            'childrenCount',
            'createdAt',
            'updatedAt',
        ]
        read_only_fields = [
            'id',
            'code',
            'level',
            'createdBy',
            'createdAt',
            'updatedAt',
            'childrenCount',
            'responsable',
        ]

    def get_childrenCount(self, obj):
        return obj.children.filter(is_active=True).count()

    def get_responsable(self, obj):
        if not obj.responsable_id:
            return None
        utilisateur = (
            Utilisateur.objects
            .filter(id_user=obj.responsable_id)
            .first()
        )
        if not utilisateur:
            return None
        return {
            'id_user': utilisateur.id_user,
            'nom': utilisateur.nom,
            'prenom': utilisateur.prenom,
            'email': utilisateur.email,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        metadata = unpack_unit_metadata(instance.description)
        data['description'] = metadata['description']
        data['title'] = metadata['title']
        data['displayCode'] = metadata['displayCode'] or instance.code
        return data

    def create(self, validated_data):
        title = validated_data.pop('title', '')
        display_code = validated_data.pop('displayCode', '')
        description = validated_data.pop('description', '')
        validated_data['description'] = pack_unit_metadata(
            description=description,
            title=title,
            display_code=display_code,
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        title = validated_data.pop(
            'title',
            unpack_unit_metadata(instance.description)['title'],
        )
        display_code = validated_data.pop(
            'displayCode',
            unpack_unit_metadata(instance.description)['displayCode'],
        )
        description = validated_data.pop(
            'description',
            unpack_unit_metadata(instance.description)['description'],
        )
        validated_data['description'] = pack_unit_metadata(
            description=description,
            title=title,
            display_code=display_code,
        )
        return super().update(instance, validated_data)

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                'Le nom doit contenir au moins 3 caracteres.'
            )
        return value

    def validate_title(self, value):
        return value.strip()

    def validate_displayCode(self, value):
        return value.strip().upper()

    def validate(self, attrs):
        unit_type = attrs.get('type', getattr(self.instance, 'type', None))
        parent_id = attrs.get('parent_id', getattr(self.instance, 'parent_id', None))
        responsable_id = attrs.get(
            'responsable_id',
            getattr(self.instance, 'responsable_id', None),
        )

        if responsable_id and not Utilisateur.objects.filter(
            id_user=responsable_id,
            est_actif=True,
        ).exists():
            raise serializers.ValidationError({'responsableId': 'Responsable introuvable.'})

        if unit_type == OrganizationUnit.UnitType.ROOT:
            if parent_id:
                raise serializers.ValidationError({
                    'parentId': 'La racine ne peut pas avoir de parent.'
                })
            root_qs = OrganizationUnit.objects.filter(
                type=OrganizationUnit.UnitType.ROOT,
                is_active=True,
            )
            if self.instance:
                root_qs = root_qs.exclude(pk=self.instance.pk)
            if root_qs.exists():
                raise serializers.ValidationError({
                    'type': 'Une racine active existe deja.'
                })
        elif not parent_id:
            raise serializers.ValidationError({
                'parentId': 'Le parent est obligatoire hors racine.'
            })

        if parent_id:
            parent = OrganizationUnit.objects.filter(pk=parent_id, is_active=True).first()
            if not parent:
                raise serializers.ValidationError({'parentId': 'Parent introuvable.'})
            if self.instance and parent.pk == self.instance.pk:
                raise serializers.ValidationError({
                    'parentId': 'Une unite ne peut pas etre son propre parent.'
                })
            if self.instance and self._is_descendant(parent, self.instance):
                raise serializers.ValidationError({
                    'parentId': 'Ce rattachement creerait un cycle.'
                })

        return attrs

    def _is_descendant(self, candidate_parent, current_unit):
        node = candidate_parent
        while node:
            if node.pk == current_unit.pk:
                return True
            node = node.parent
        return False


class OrganizationTreeSerializer(OrganizationUnitSerializer):
    children = serializers.SerializerMethodField()

    class Meta(OrganizationUnitSerializer.Meta):
        fields = OrganizationUnitSerializer.Meta.fields + ['children']

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('level', 'code', 'name')
        return OrganizationTreeSerializer(children, many=True, context=self.context).data


class EmployeeSerializer(serializers.Serializer):
    id_user = serializers.IntegerField()
    nom = serializers.CharField()
    prenom = serializers.CharField()
    email = serializers.EmailField()
    est_actif = serializers.BooleanField()
    departement = serializers.IntegerField(allow_null=True, source='id_departement')
    matricule = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    def get_matricule(self, obj):
        return f'EMP-{obj.id_user:03d}'

    def get_roles(self, obj):
        return get_active_role_labels_for_user(obj.id_user)
