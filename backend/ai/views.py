from django.db.models import Count
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from .models import AIConversation, AIMessage
from .serializers import (
    AIConversationListSerializer,
    AIConversationSerializer,
    SendMessageSerializer,
)


class AIConversationViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "conversation_id"

    def get_serializer_class(self):
        if self.action in ("retrieve", "message"):
            return AIConversationSerializer
        return AIConversationListSerializer

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

    @action(detail=True, methods=["post"], url_path="message")
    def message(self, request, conversation_id=None):
        try:
            conversation = AIConversation.objects.prefetch_related("messages").get(
                pk=conversation_id, user=request.user
            )
        except AIConversation.DoesNotExist as err:
            raise NotFound("Conversation not found.") from err

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.USER,
            content=serializer.validated_data["content"],
        )

        # Stub — OpenAI integration wired in later
        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.ASSISTANT,
            content="[AI integration not yet connected]",
        )

        return Response(
            AIConversationSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
