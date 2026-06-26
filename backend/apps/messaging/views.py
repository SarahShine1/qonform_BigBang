from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Utilisateur
from apps.accounts.utils import get_active_role_labels_for_user, get_auth_user_for_utilisateur

from .models import Conversation, Message
from .serializers import MessageCreateSerializer


def get_profile_for_auth_user(auth_user):
    try:
        profile = getattr(auth_user, "utilisateur", None)
    except Exception:
        profile = None

    if profile:
        return profile

    return (
        Utilisateur.objects.filter(auth=auth_user).first()
        or Utilisateur.objects.filter(email__iexact=auth_user.email).first()
    )


def get_roles_for_profile(profile):
    if not profile:
        return []
    return get_active_role_labels_for_user(profile.id_user)


def get_auth_user_for_profile(profile):
    if not profile:
        return None
    return get_auth_user_for_utilisateur(profile)


def require_profile(auth_user):
    profile = get_profile_for_auth_user(auth_user)
    if not profile:
        raise ValidationError("Profil utilisateur introuvable pour cette session.")
    return profile


def get_counterpart_auth_user(conversation, auth_user):
    return (
        conversation.utilisateur
        if conversation.auditeur_id == auth_user.id
        else conversation.auditeur
    )


def serialize_profile(profile, conversation_id=None):
    roles = get_roles_for_profile(profile)
    return {
        "id_user": profile.id_user,
        "nom": profile.nom,
        "prenom": profile.prenom,
        "email": profile.email,
        "roles": roles,
        "conversation_id": conversation_id,
        "has_conversation": conversation_id is not None,
    }


def serialize_message(message, current_user):
    sender_profile = get_profile_for_auth_user(message.sender)
    sender_name = ""
    sender_id = None

    if sender_profile:
        sender_name = f"{sender_profile.prenom} {sender_profile.nom}".strip()
        sender_id = sender_profile.id_user

    return {
        "id": message.id,
        "content": message.content,
        "created_at": message.created_at,
        "is_read": message.is_read,
        "is_mine": message.sender_id == current_user.id,
        "sender": {
            "id_user": sender_id,
            "name": sender_name or message.sender.email,
            "email": message.sender.email,
        },
    }


def serialize_conversation(conversation, current_user):
    counterpart_profile = require_profile(
        get_counterpart_auth_user(conversation, current_user)
    )
    last_message = conversation.messages.order_by("-created_at", "-id").first()
    unread_count = conversation.messages.filter(is_read=False).exclude(
        sender=current_user
    ).count()

    return {
        "id": conversation.id,
        "updated_at": conversation.updated_at,
        "counterpart": serialize_profile(
            counterpart_profile,
            conversation_id=conversation.id,
        ),
        "last_message": serialize_message(last_message, current_user)
        if last_message
        else None,
        "unread_count": unread_count,
    }


def ensure_user_is_participant(conversation, auth_user):
    if auth_user.id not in {conversation.auditeur_id, conversation.utilisateur_id}:
        raise PermissionDenied("Cette conversation ne vous appartient pas.")


def get_allowed_contacts_for_profile(profile):
    candidates = (
        Utilisateur.objects.filter(est_actif=True)
        .exclude(id_user=profile.id_user)
        .order_by("nom", "prenom", "id_user")
    )

    results = []
    for candidate in candidates:
        candidate_auth = get_auth_user_for_profile(candidate)
        if not candidate_auth or not candidate_auth.is_active:
            continue

        results.append(candidate)

    return results


def get_or_create_conversation_between(first_user, second_user):
    conversation = Conversation.objects.filter(
        Q(auditeur=first_user, utilisateur=second_user)
        | Q(auditeur=second_user, utilisateur=first_user)
    ).first()
    if conversation:
        return conversation

    auditeur_auth, utilisateur_auth = sorted(
        [first_user, second_user],
        key=lambda user: user.id,
    )
    return Conversation.objects.create(
        auditeur=auditeur_auth,
        utilisateur=utilisateur_auth,
    )


class ContactListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = require_profile(request.user)
        conversations = Conversation.objects.filter(
            Q(auditeur=request.user) | Q(utilisateur=request.user)
        ).select_related("auditeur", "utilisateur")

        existing_conversations = {}
        for conversation in conversations:
            counterpart_auth = get_counterpart_auth_user(conversation, request.user)
            counterpart_profile = get_profile_for_auth_user(counterpart_auth)
            if counterpart_profile:
                existing_conversations[counterpart_profile.id_user] = conversation.id

        contacts = [
            serialize_profile(
                contact,
                conversation_id=existing_conversations.get(contact.id_user),
            )
            for contact in get_allowed_contacts_for_profile(profile)
        ]
        return Response(contacts)


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_profile(request.user)
        conversations = Conversation.objects.filter(
            Q(auditeur=request.user) | Q(utilisateur=request.user)
        ).select_related("auditeur", "utilisateur")

        payload = [
            serialize_conversation(conversation, request.user)
            for conversation in conversations
        ]
        return Response(payload)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.select_related("auditeur", "utilisateur"),
            pk=conversation_id,
        )
        ensure_user_is_participant(conversation, request.user)

        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(
            is_read=True
        )

        messages = conversation.messages.select_related("sender").all()
        payload = [serialize_message(message, request.user) for message in messages]
        return Response(payload)


class MessageCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sender_profile = require_profile(request.user)
        recipient_profile = get_object_or_404(
            Utilisateur.objects.filter(est_actif=True),
            pk=serializer.validated_data["recipient_id"],
        )
        recipient_auth = get_auth_user_for_profile(recipient_profile)

        if sender_profile.id_user == recipient_profile.id_user:
            raise ValidationError("Vous ne pouvez pas vous envoyer un message.")

        if not recipient_auth or not recipient_auth.is_active:
            raise ValidationError("Ce contact n'a pas de compte de connexion exploitable.")

        conversation = get_or_create_conversation_between(
            request.user,
            recipient_auth,
        )

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=serializer.validated_data["content"],
        )

        return Response(
            {
                "conversation": serialize_conversation(conversation, request.user),
                "message": serialize_message(message, request.user),
            },
            status=status.HTTP_201_CREATED,
        )
