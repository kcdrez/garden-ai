from django.db.models import Count
from openai import OpenAIError
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from .ai_service import send_message
from .context_builder import build_context
from .models import AIConversation, AIMessage
from .serializers import (
    AIConversationListSerializer,
    AIConversationSerializer,
    SendMessageSerializer,
)

_HISTORY_LIMIT = 20


class AIConversationViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "conversation_id"

    def get_serializer_class(self):
        if self.action == "list":
            return AIConversationListSerializer
        return AIConversationSerializer

    def get_queryset(self):
        qs = AIConversation.objects.filter(user=self.request.user)

        if garden_id := self.request.query_params.get("garden"):
            qs = qs.filter(scope=AIConversation.Scope.GARDEN, garden_id=garden_id)
        elif bed_id := self.request.query_params.get("bed"):
            qs = qs.filter(scope=AIConversation.Scope.BED, bed_id=bed_id)
        elif plant_id := self.request.query_params.get("plant"):
            qs = qs.filter(scope=AIConversation.Scope.PLANT, plant_id=plant_id)

        if self.action == "list":
            qs = qs.annotate(message_count=Count("messages"))

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="message")
    def message(self, request, conversation_id=None):
        try:
            conversation = AIConversation.objects.get(pk=conversation_id, user=request.user)
        except AIConversation.DoesNotExist as err:
            raise NotFound("Conversation not found.") from err

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.USER,
            content=serializer.validated_data["content"],
        )

        history = list(
            AIMessage.objects.filter(conversation=conversation)
            .order_by("created_at")
            .values("role", "content")
        )[-_HISTORY_LIMIT:]

        system = build_context(conversation)

        try:
            content, input_tokens, output_tokens = send_message(system, history)
        except OpenAIError:
            return Response(
                {"detail": "AI service unavailable. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.ASSISTANT,
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        conversation = AIConversation.objects.prefetch_related("messages").get(pk=conversation_id)
        return Response(
            AIConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
