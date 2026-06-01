from datetime import date, datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden

from .models import AIConversation, AIMessage


class AIRateLimitTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.client.force_authenticate(user=self.user)
        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.conversation = AIConversation.objects.create(
            user=self.user,
            scope=AIConversation.Scope.GARDEN,
            garden=self.garden,
        )
        self.url = reverse("ai-conversations-message", kwargs={"conversation_id": self.conversation.id})

    def _create_user_messages(self, count, on_date=None):
        for _ in range(count):
            msg = AIMessage.objects.create(
                conversation=self.conversation,
                role=AIMessage.Role.USER,
                content="test message",
            )
            if on_date is not None:
                ts = datetime(on_date.year, on_date.month, on_date.day, tzinfo=dt_timezone.utc)
                AIMessage.objects.filter(pk=msg.pk).update(created_at=ts)

    @patch("ai.views.send_message", return_value=("AI response", 10, 20))
    def test_message_accepted_under_limit(self, _mock):
        self._create_user_messages(19)
        res = self.client.post(self.url, {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_message_rejected_at_limit(self):
        self._create_user_messages(20)
        res = self.client.post(self.url, {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Daily message limit", res.data["detail"])

    def test_message_rejected_over_limit(self):
        self._create_user_messages(25)
        res = self.client.post(self.url, {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch("ai.views.send_message", return_value=("AI response", 10, 20))
    def test_limit_resets_next_day(self, _mock):
        yesterday = date.today() - timedelta(days=1)
        self._create_user_messages(20, on_date=yesterday)
        res = self.client.post(self.url, {"content": "new message today"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @patch("ai.views.send_message", return_value=("AI response", 10, 20))
    def test_limit_is_per_user(self, _mock):
        other = User.objects.create_user(username="bob", password="testpass123")
        other_garden = Garden.objects.create(name="Bob's Garden", owner=other)
        other_conv = AIConversation.objects.create(
            user=other,
            scope=AIConversation.Scope.GARDEN,
            garden=other_garden,
        )
        for _ in range(20):
            AIMessage.objects.create(
                conversation=other_conv,
                role=AIMessage.Role.USER,
                content="bob's message",
            )
        self._create_user_messages(19)
        res = self.client.post(self.url, {"content": "alice's 20th"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @patch("ai.views.send_message", return_value=("AI response", 10, 20))
    def test_assistant_messages_do_not_count_toward_limit(self, _mock):
        for _ in range(20):
            AIMessage.objects.create(
                conversation=self.conversation,
                role=AIMessage.Role.ASSISTANT,
                content="AI reply",
            )
        res = self.client.post(self.url, {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_request_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
