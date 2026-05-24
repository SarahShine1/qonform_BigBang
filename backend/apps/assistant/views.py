from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AssistantQuerySerializer, AssistantResponseSerializer
from .services import answer_assistant_question


class AssistantQueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AssistantQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payload = answer_assistant_question(
            user=request.user,
            question=serializer.validated_data["question"],
            context=serializer.validated_data.get("context") or {},
        )

        response_serializer = AssistantResponseSerializer(payload)
        return Response(response_serializer.data)

