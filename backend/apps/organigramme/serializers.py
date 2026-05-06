from rest_framework import serializers

from apps.accounts.models import Utilisateur

from .models import OrganizationUnit


TYPE_PREFIXES = {
    OrganizationUnit.UnitType.ROOT: 'ROOT',
    OrganizationUnit.UnitType.DIRECTION: 'DIR',
    OrganizationUnit.UnitType.DEPARTMENT: 'DEPT',
    OrganizationUnit.UnitType.SERVICE: 'SRV',
    OrganizationUnit.UnitType.CELLULE: 'CELL',
}


def normalize_role(role):
    return str(role or '').strip().upper()


def get_user_profile(user):
    try:
        return user.utilisateur
    except (AttributeError, Utilisateur.DoesNotExist):
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

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                'Le nom doit contenir au moins 3 caracteres.'
            )
        return value

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
        roles = obj.userrole_set.select_related('role').all()
        return [user_role.role.libelle for user_role in roles]
