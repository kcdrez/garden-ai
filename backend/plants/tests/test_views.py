import uuid

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden, GardenBed
from plants.models import Observation, Plant, PlantPlacement, UserPlant


class UserPlantAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(
            name="Bed 1", garden=self.garden, length=4, width=8
        )
        self.other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        self.other_bed = GardenBed.objects.create(
            name="Bob's Bed", garden=self.other_garden, length=4, width=8
        )

        self.plant = Plant.objects.first()
        self.user_plant = UserPlant.objects.create(
            bed=self.bed, plant=self.plant, status="planted"
        )

    def _list_url(self, garden_id, bed_id):
        return reverse("user-plants-list", kwargs={"garden_id": garden_id, "bed_id": bed_id})

    def _detail_url(self, garden_id, bed_id, plant_id):
        return reverse(
            "user-plants-detail",
            kwargs={"garden_id": garden_id, "bed_id": bed_id, "plant_id": plant_id},
        )

    # --- List ---

    def test_list_plants_in_own_bed(self):
        res = self.client.get(self._list_url(self.garden.id, self.bed.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_plants_in_other_users_bed_returns_404(self):
        res = self.client.get(self._list_url(self.other_garden.id, self.other_bed.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Create ---

    def test_create_user_plant(self):
        res = self.client.post(
            self._list_url(self.garden.id, self.bed.id),
            {"plant": str(self.plant.id), "status": "planned"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["plant_name"], self.plant.common_name)

    def test_create_user_plant_with_start_date_uses_start_date_for_observation(self):
        res = self.client.post(
            self._list_url(self.garden.id, self.bed.id),
            {"plant": str(self.plant.id), "status": "planned", "start_date": "2025-03-01"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        obs = Observation.objects.get(user_plant_id=res.data[0]["id"])
        self.assertEqual(str(obs.observed_date), "2025-03-01")

    def test_create_user_plant_without_start_date_uses_today_for_observation(self):
        res = self.client.post(
            self._list_url(self.garden.id, self.bed.id),
            {"plant": str(self.plant.id), "status": "planned"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        obs = Observation.objects.get(user_plant_id=res.data[0]["id"])
        from datetime import date
        self.assertEqual(obs.observed_date, date.today())

    def test_create_user_plant_with_quantity(self):
        res = self.client.post(
            self._list_url(self.garden.id, self.bed.id),
            {"plant": str(self.plant.id), "status": "planned", "quantity": 3},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data), 3)
        self.assertTrue(UserPlant.objects.filter(bed=self.bed, plant=self.plant).count() >= 3)

    def test_create_plant_in_other_users_bed_returns_404(self):
        res = self.client.post(
            self._list_url(self.other_garden.id, self.other_bed.id),
            {"plant": str(self.plant.id), "status": "planned"},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Retrieve ---

    def test_retrieve_own_plant(self):
        res = self.client.get(self._detail_url(self.garden.id, self.bed.id, self.user_plant.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], str(self.user_plant.id))

    # --- Update ---

    def test_patch_status(self):
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"status": "growing"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "growing")

    def test_patch_status_creates_observation(self):
        from plants.models import Observation

        self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"status": "growing"},
        )
        self.assertTrue(
            Observation.objects.filter(
                user_plant=self.user_plant, type="status_change", new_status="growing"
            ).exists()
        )

    # --- Delete ---

    def test_delete_own_plant(self):
        res = self.client.delete(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id)
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserPlant.objects.filter(id=self.user_plant.id).exists())

    # --- Move ---

    def test_move_plant_to_own_bed(self):
        second_bed = GardenBed.objects.create(
            name="Bed 2", garden=self.garden, length=4, width=8
        )
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"bed": str(second_bed.id)},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user_plant.refresh_from_db()
        self.assertEqual(self.user_plant.bed, second_bed)

    def test_move_plant_creates_transplant_observation(self):
        second_bed = GardenBed.objects.create(
            name="Bed 2", garden=self.garden, length=4, width=8
        )
        self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"bed": str(second_bed.id)},
        )
        obs = Observation.objects.filter(
            user_plant=self.user_plant, type=Observation.Type.TRANSPLANT
        )
        self.assertEqual(obs.count(), 1)
        self.assertEqual(obs.first().note, f"Moved from {self.bed.name} to {second_bed.name}")

    def test_move_plant_to_other_users_bed_is_rejected(self):
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"bed": str(self.other_bed.id)},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --- All user plants flat list ---

    def test_all_user_plants_list(self):
        res = self.client.get(reverse("all-user-plants"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    # --- Timezone fallback ---

    def test_create_plant_with_invalid_profile_timezone_falls_back_to_utc(self):
        from users.models import UserProfile
        UserProfile.objects.filter(user=self.user).update(timezone="Invalid/Timezone")
        res = self.client.post(
            self._list_url(self.garden.id, self.bed.id),
            {"plant": str(self.plant.id), "status": "planned"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_move_plant_deletes_existing_placement(self):
        second_bed = GardenBed.objects.create(
            name="Bed 2", garden=self.garden, length=4, width=8
        )
        PlantPlacement.objects.create(user_plant=self.user_plant, bed=self.bed, x=0, y=0)

        self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"bed": str(second_bed.id)},
        )
        self.assertFalse(PlantPlacement.objects.filter(user_plant=self.user_plant).exists())


class PlantPlacementAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(
            name="Bed 1", garden=self.garden, length=4, width=8
        )
        self.plant = Plant.objects.first()
        self.user_plant = UserPlant.objects.create(
            bed=self.bed, plant=self.plant, status="planted"
        )

    def _list_url(self):
        return reverse(
            "placements-list",
            kwargs={"garden_id": self.garden.id, "bed_id": self.bed.id},
        )

    def _detail_url(self, placement_id):
        return reverse(
            "placements-detail",
            kwargs={
                "garden_id": self.garden.id,
                "bed_id": self.bed.id,
                "placement_id": placement_id,
            },
        )

    def test_create_placement(self):
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 0, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_placement_out_of_bounds_is_rejected(self):
        # bed is 8ft wide = 8 columns (0-7); x=8 is out of bounds
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 8, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_placement_y_out_of_bounds_is_rejected(self):
        # bed is 4ft long = 4 rows (0-3); y=4 is out of bounds
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 0, "y": 4},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_placement_for_plant_from_different_bed_rejected(self):
        second_bed = GardenBed.objects.create(
            name="Bed 2", garden=self.garden, length=4, width=8
        )
        plant_in_second_bed = UserPlant.objects.create(
            bed=second_bed, plant=self.plant, status="planted"
        )
        # URL targets self.bed but the plant lives in second_bed
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(plant_in_second_bed.id), "x": 0, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_placement_for_other_users_plant_rejected(self):
        other_user = User.objects.create_user(username="charlie", password="testpass123")
        other_garden = Garden.objects.create(name="Charlie's Garden", owner=other_user)
        other_bed = GardenBed.objects.create(
            name="Charlie's Bed", garden=other_garden, length=4, width=8
        )
        other_plant = UserPlant.objects.create(
            bed=other_bed, plant=self.plant, status="planted"
        )
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(other_plant.id), "x": 0, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_placement(self):
        placement = PlantPlacement.objects.create(
            user_plant=self.user_plant, bed=self.bed, x=0, y=0
        )
        res = self.client.delete(self._detail_url(placement.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlantPlacement.objects.filter(id=placement.id).exists())


class ObservationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        self.plant = Plant.objects.first()
        self.user_plant = UserPlant.objects.create(
            bed=self.bed, plant=self.plant, status="planted"
        )

        other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        other_bed = GardenBed.objects.create(
            name="Bob's Bed", garden=other_garden, length=4, width=8
        )
        self.other_plant = UserPlant.objects.create(
            bed=other_bed, plant=self.plant, status="planted"
        )

    def _list_url(self, user_plant=None):
        up = user_plant or self.user_plant
        return reverse(
            "observations-list",
            kwargs={
                "garden_id": up.bed.garden.id,
                "bed_id": up.bed.id,
                "plant_id": up.id,
            },
        )

    def _detail_url(self, observation_id, user_plant=None):
        up = user_plant or self.user_plant
        return reverse(
            "observations-detail",
            kwargs={
                "garden_id": up.bed.garden.id,
                "bed_id": up.bed.id,
                "plant_id": up.id,
                "observation_id": observation_id,
            },
        )

    # --- Auth ---

    def test_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self._list_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- List ---

    def test_list_observations_for_own_plant(self):
        Observation.objects.create(
            user_plant=self.user_plant,
            observed_date="2026-01-01",
            type=Observation.Type.GENERAL,
        )
        res = self.client.get(self._list_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_observations_other_users_plant_returns_404(self):
        res = self.client.get(self._list_url(user_plant=self.other_plant))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Create ---

    def test_create_observation(self):
        res = self.client.post(
            self._list_url(),
            {"observedDate": "2026-01-15", "type": "general", "note": "Looking healthy"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["type"], "general")

    def test_create_observation_requires_type_and_date(self):
        res = self.client.post(self._list_url(), {"note": "Missing required fields"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_observation_other_users_plant_returns_404(self):
        res = self.client.post(
            self._list_url(user_plant=self.other_plant),
            {"observedDate": "2026-01-15", "type": "general"},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Delete ---

    def test_delete_observation(self):
        obs = Observation.objects.create(
            user_plant=self.user_plant,
            observed_date="2026-01-01",
            type=Observation.Type.GENERAL,
        )
        res = self.client.delete(self._detail_url(obs.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Observation.objects.filter(id=obs.id).exists())

    def test_delete_nonexistent_observation_returns_404(self):
        res = self.client.delete(self._detail_url(uuid.uuid4()))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Update ---

    def test_patch_observation_updates_date_and_note(self):
        obs = Observation.objects.create(
            user_plant=self.user_plant,
            observed_date="2026-01-01",
            type=Observation.Type.GENERAL,
            note="original note",
        )
        res = self.client.patch(
            self._detail_url(obs.id),
            {"observedDate": "2026-03-15", "note": "updated note"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        obs.refresh_from_db()
        self.assertEqual(str(obs.observed_date), "2026-03-15")
        self.assertEqual(obs.note, "updated note")

    def test_patch_observation_cannot_change_type(self):
        obs = Observation.objects.create(
            user_plant=self.user_plant,
            observed_date="2026-01-01",
            type=Observation.Type.GENERAL,
        )
        self.client.patch(self._detail_url(obs.id), {"type": "pest"})
        obs.refresh_from_db()
        self.assertEqual(obs.type, Observation.Type.GENERAL)

    def test_patch_observation_other_users_plant_returns_404(self):
        obs = Observation.objects.create(
            user_plant=self.other_plant,
            observed_date="2026-01-01",
            type=Observation.Type.GENERAL,
        )
        res = self.client.patch(
            self._detail_url(obs.id, user_plant=self.other_plant),
            {"observedDate": "2026-03-15"},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class PlantModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.garden = Garden.objects.create(name="Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed", garden=self.garden, length=4, width=8)
        self.plant = Plant.objects.first()

    def test_plant_str(self):
        self.assertEqual(str(self.plant), self.plant.common_name)

    def test_user_plant_str_without_variety(self):
        up = UserPlant.objects.create(bed=self.bed, plant=self.plant, status="planted")
        self.assertEqual(str(up), self.plant.common_name)

    def test_user_plant_str_with_variety(self):
        up = UserPlant.objects.create(
            bed=self.bed, plant=self.plant, status="planted", variety="Roma"
        )
        self.assertEqual(str(up), f"{self.plant.common_name} (Roma)")

    def test_observation_str(self):
        up = UserPlant.objects.create(bed=self.bed, plant=self.plant, status="planted")
        obs = Observation.objects.create(
            user_plant=up, observed_date="2026-01-01", type=Observation.Type.GENERAL
        )
        self.assertIn("general", str(obs))

    def test_plant_placement_str(self):
        up = UserPlant.objects.create(bed=self.bed, plant=self.plant, status="planted")
        pp = PlantPlacement.objects.create(user_plant=up, bed=self.bed, x=1, y=2)
        self.assertIn("@ (1, 2)", str(pp))
