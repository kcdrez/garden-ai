from django.urls import path

from .views import AIConversationViewSet

conversation_list = AIConversationViewSet.as_view({"get": "list", "post": "create"})
conversation_detail = AIConversationViewSet.as_view({"get": "retrieve"})
conversation_message = AIConversationViewSet.as_view({"post": "message"})

urlpatterns = [
    path("ai/conversations/", conversation_list, name="ai-conversations-list"),
    path("ai/conversations/<uuid:conversation_id>/", conversation_detail, name="ai-conversations-detail"),
    path("ai/conversations/<uuid:conversation_id>/message/", conversation_message, name="ai-conversations-message"),
]
