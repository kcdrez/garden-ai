from datetime import UTC, date, datetime, timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden, GardenBed
from plants.models import Observation, Plant, PlantPlacement, UserPlant

from .models import AIConversation, AIMessage
from .views import _exec_add_plant, _exec_change_status, _exec_delete_plant, _exec_log_observation, _exec_move_plant


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
                ts = datetime(on_date.year, on_date.month, on_date.day, tzinfo=UTC)
                AIMessage.objects.filter(pk=msg.pk).update(created_at=ts)

    @patch("ai.views.send_message_with_tools", return_value=("AI response", 10, 20, None))
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

    @patch("ai.views.send_message_with_tools", return_value=("AI response", 10, 20, None))
    def test_limit_resets_next_day(self, _mock):
        yesterday = date.today() - timedelta(days=1)
        self._create_user_messages(20, on_date=yesterday)
        res = self.client.post(self.url, {"content": "new message today"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @patch("ai.views.send_message_with_tools", return_value=("AI response", 10, 20, None))
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

    @patch("ai.views.send_message_with_tools", return_value=("AI response", 10, 20, None))
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


class ToolExecutorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        self.other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        self.other_bed = GardenBed.objects.create(name="Bob's Bed", garden=self.other_garden, length=4, width=8)
        self.plant = Plant.objects.first()
        self.user_plant = UserPlant.objects.create(bed=self.bed, plant=self.plant, status="planted")

    # --- add_plant ---

    def test_add_plant_creates_user_plant(self):
        result = _exec_add_plant(self.user, {"catalog_id": str(self.plant.pk), "bed_id": str(self.bed.pk)})
        self.assertNotIn("error", result)
        self.assertTrue(UserPlant.objects.filter(pk=result["plantId"]).exists())

    def test_add_plant_creates_initial_observation(self):
        result = _exec_add_plant(self.user, {"catalog_id": str(self.plant.pk), "bed_id": str(self.bed.pk)})
        obs = Observation.objects.filter(user_plant_id=result["plantId"], type=Observation.Type.STATUS_CHANGE)
        self.assertEqual(obs.count(), 1)

    def test_add_plant_defaults_to_planned_status(self):
        result = _exec_add_plant(self.user, {"catalog_id": str(self.plant.pk), "bed_id": str(self.bed.pk)})
        plant = UserPlant.objects.get(pk=result["plantId"])
        self.assertEqual(plant.status, UserPlant.Status.PLANNED)

    def test_add_plant_invalid_catalog_id_returns_error(self):
        result = _exec_add_plant(
            self.user,
            {"catalog_id": "00000000-0000-0000-0000-000000000000", "bed_id": str(self.bed.pk)},
        )
        self.assertTrue(result.get("error"))

    def test_add_plant_wrong_bed_returns_error(self):
        result = _exec_add_plant(self.user, {"catalog_id": str(self.plant.pk), "bed_id": str(self.other_bed.pk)})
        self.assertTrue(result.get("error"))
        self.assertFalse(UserPlant.objects.filter(bed=self.other_bed).exists())

    # --- change_status ---

    def test_change_status_updates_plant(self):
        result = _exec_change_status(self.user, {"plant_id": str(self.user_plant.pk), "new_status": "growing"})
        self.assertNotIn("error", result)
        self.user_plant.refresh_from_db()
        self.assertEqual(self.user_plant.status, "growing")

    def test_change_status_creates_observation(self):
        _exec_change_status(self.user, {"plant_id": str(self.user_plant.pk), "new_status": "growing"})
        obs = Observation.objects.filter(
            user_plant=self.user_plant,
            type=Observation.Type.STATUS_CHANGE,
            new_status="growing",
        )
        self.assertEqual(obs.count(), 1)

    def test_change_status_wrong_plant_returns_error(self):
        other_plant = UserPlant.objects.create(bed=self.other_bed, plant=self.plant, status="planted")
        result = _exec_change_status(self.user, {"plant_id": str(other_plant.pk), "new_status": "growing"})
        self.assertTrue(result.get("error"))
        other_plant.refresh_from_db()
        self.assertEqual(other_plant.status, "planted")

    def test_change_status_invalid_status_returns_error(self):
        result = _exec_change_status(self.user, {"plant_id": str(self.user_plant.pk), "new_status": "exploded"})
        self.assertTrue(result.get("error"))

    # --- log_observation ---

    def test_log_observation_creates_observation(self):
        result = _exec_log_observation(
            self.user, {"plant_id": str(self.user_plant.pk), "type": "general", "note": "Looks healthy"}
        )
        self.assertNotIn("error", result)
        self.assertTrue(
            Observation.objects.filter(user_plant=self.user_plant, type="general", note="Looks healthy").exists()
        )

    def test_log_observation_uses_today_when_date_omitted(self):
        _exec_log_observation(self.user, {"plant_id": str(self.user_plant.pk), "type": "harvest", "note": "Big crop"})
        obs = Observation.objects.filter(user_plant=self.user_plant, type="harvest").first()
        self.assertIsNotNone(obs)
        from datetime import date
        self.assertEqual(obs.observed_date, date.today())

    def test_log_observation_respects_observed_date(self):
        _exec_log_observation(
            self.user,
            {"plant_id": str(self.user_plant.pk), "type": "pest", "note": "Aphids", "observed_date": "2025-06-01"},
        )
        obs = Observation.objects.filter(user_plant=self.user_plant, type="pest").first()
        from datetime import date
        self.assertEqual(obs.observed_date, date(2025, 6, 1))

    def test_log_observation_status_change_type_rejected(self):
        result = _exec_log_observation(
            self.user, {"plant_id": str(self.user_plant.pk), "type": "status_change", "note": "x"}
        )
        self.assertTrue(result.get("error"))

    def test_log_observation_wrong_plant_returns_error(self):
        other_plant = UserPlant.objects.create(bed=self.other_bed, plant=self.plant, status="planted")
        result = _exec_log_observation(
            self.user, {"plant_id": str(other_plant.pk), "type": "general", "note": "x"}
        )
        self.assertTrue(result.get("error"))

    # --- delete_plant ---

    def test_delete_plant_removes_user_plant(self):
        plant_id = str(self.user_plant.pk)
        result = _exec_delete_plant(self.user, {"plant_id": plant_id, "confirm": True})
        self.assertNotIn("error", result)
        self.assertFalse(UserPlant.objects.filter(pk=plant_id).exists())

    def test_delete_plant_without_confirm_returns_error(self):
        result = _exec_delete_plant(self.user, {"plant_id": str(self.user_plant.pk), "confirm": False})
        self.assertTrue(result.get("error"))
        self.assertTrue(UserPlant.objects.filter(pk=self.user_plant.pk).exists())

    def test_delete_plant_wrong_owner_returns_error(self):
        other_plant = UserPlant.objects.create(bed=self.other_bed, plant=self.plant, status="planted")
        result = _exec_delete_plant(self.user, {"plant_id": str(other_plant.pk), "confirm": True})
        self.assertTrue(result.get("error"))
        self.assertTrue(UserPlant.objects.filter(pk=other_plant.pk).exists())

    # --- move_plant ---

    def test_move_plant_changes_bed(self):
        extra_bed = GardenBed.objects.create(name="Bed 2", garden=self.garden, length=4, width=8)
        result = _exec_move_plant(
            self.user, {"plant_id": str(self.user_plant.pk), "target_bed_id": str(extra_bed.pk)}
        )
        self.assertNotIn("error", result)
        self.user_plant.refresh_from_db()
        self.assertEqual(self.user_plant.bed, extra_bed)

    def test_move_plant_deletes_placement(self):
        extra_bed = GardenBed.objects.create(name="Bed 2", garden=self.garden, length=4, width=8)
        PlantPlacement.objects.create(user_plant=self.user_plant, bed=self.bed, x=0, y=0, width=1, height=1)
        _exec_move_plant(self.user, {"plant_id": str(self.user_plant.pk), "target_bed_id": str(extra_bed.pk)})
        self.assertFalse(PlantPlacement.objects.filter(user_plant=self.user_plant).exists())

    def test_move_plant_creates_transplant_observation(self):
        extra_bed = GardenBed.objects.create(name="Bed 2", garden=self.garden, length=4, width=8)
        _exec_move_plant(self.user, {"plant_id": str(self.user_plant.pk), "target_bed_id": str(extra_bed.pk)})
        obs = Observation.objects.filter(user_plant=self.user_plant, type=Observation.Type.TRANSPLANT)
        self.assertEqual(obs.count(), 1)

    def test_move_plant_same_bed_returns_error(self):
        result = _exec_move_plant(
            self.user, {"plant_id": str(self.user_plant.pk), "target_bed_id": str(self.bed.pk)}
        )
        self.assertTrue(result.get("error"))

    def test_move_plant_wrong_owner_bed_returns_error(self):
        result = _exec_move_plant(
            self.user, {"plant_id": str(self.user_plant.pk), "target_bed_id": str(self.other_bed.pk)}
        )
        self.assertTrue(result.get("error"))
        self.user_plant.refresh_from_db()
        self.assertEqual(self.user_plant.bed, self.bed)


class AIToolViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.client.force_authenticate(user=self.user)
        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        self.bed_conversation = AIConversation.objects.create(
            user=self.user, scope=AIConversation.Scope.BED, bed=self.bed
        )
        self.garden_conversation = AIConversation.objects.create(
            user=self.user, scope=AIConversation.Scope.GARDEN, garden=self.garden
        )

    def _url(self, conv):
        return reverse("ai-conversations-message", kwargs={"conversation_id": conv.id})

    @patch("ai.views.send_message_with_tools", return_value=("reply", 10, 20, None))
    def test_bed_scope_uses_tools_no_action_in_response(self, _mock):
        res = self.client.post(self._url(self.bed_conversation), {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("action", res.data)

    @patch("ai.views.send_message_with_tools", return_value=(
        "Added it!", 10, 20,
        {"type": "add_plant", "plantId": "abc", "bedId": "def", "plantName": "Tomato", "bedName": "Bed 1"},
    ))
    def test_bed_scope_includes_action_in_response_when_tool_fires(self, _mock):
        res = self.client.post(self._url(self.bed_conversation), {"content": "add a tomato"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("action", res.data)
        self.assertEqual(res.data["action"]["type"], "add_plant")

    @patch("ai.views.send_message_with_tools", return_value=("reply", 10, 20, None))
    def test_garden_scope_uses_tools_no_action_in_response(self, _mock):
        res = self.client.post(self._url(self.garden_conversation), {"content": "hello"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("action", res.data)

    @patch("ai.views.send_message_with_tools", return_value=(
        "Added it!", 10, 20,
        {"type": "add_plant", "plantId": "abc", "bedId": "def", "plantName": "Tomato", "bedName": "Bed 1"},
    ))
    def test_garden_scope_includes_action_in_response_when_tool_fires(self, _mock):
        res = self.client.post(self._url(self.garden_conversation), {"content": "add a tomato to Bed 1"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("action", res.data)
        self.assertEqual(res.data["action"]["type"], "add_plant")
