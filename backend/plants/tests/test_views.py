import uuid

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden, GardenBed
from plants.models import CompanionPlanting, Observation, Plant, PlantPlacement, UserPlant


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

    # --- Clone ---

    def _clone_url(self, garden_id, bed_id, plant_id):
        return reverse("user-plant-clone", kwargs={"garden_id": garden_id, "bed_id": bed_id, "plant_id": plant_id})

    def test_clone_creates_new_plant(self):
        res = self.client.post(self._clone_url(self.garden.id, self.bed.id, self.user_plant.id))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserPlant.objects.filter(bed=self.bed, plant=self.plant).count(), 2)

    def test_clone_copies_fields(self):
        self.user_plant.variety = "Cherry"
        self.user_plant.notes = "fragile"
        self.user_plant.save()
        res = self.client.post(self._clone_url(self.garden.id, self.bed.id, self.user_plant.id))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        clone = UserPlant.objects.exclude(pk=self.user_plant.pk).get(bed=self.bed)
        self.assertEqual(clone.plant, self.plant)
        self.assertEqual(clone.status, self.user_plant.status)
        self.assertEqual(clone.variety, "Cherry")
        self.assertEqual(clone.notes, "fragile")

    def test_clone_with_placement_creates_placement_with_bed(self):
        res = self.client.post(
            self._clone_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"x": "1.0", "y": "1.0", "width": "1.0", "height": "1.0"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        clone = UserPlant.objects.exclude(pk=self.user_plant.pk).get(bed=self.bed)
        placement = PlantPlacement.objects.get(user_plant=clone)
        self.assertEqual(placement.bed, self.bed)
        self.assertAlmostEqual(placement.x, 1.0)
        self.assertAlmostEqual(placement.y, 1.0)

    def test_clone_without_placement_data_creates_no_placement(self):
        res = self.client.post(self._clone_url(self.garden.id, self.bed.id, self.user_plant.id))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        clone = UserPlant.objects.exclude(pk=self.user_plant.pk).get(bed=self.bed)
        self.assertFalse(PlantPlacement.objects.filter(user_plant=clone).exists())

    def test_clone_other_users_plant_returns_404(self):
        other_plant = UserPlant.objects.create(bed=self.other_bed, plant=self.plant, status="planted")
        res = self.client.post(self._clone_url(self.other_garden.id, self.other_bed.id, other_plant.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


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

    def test_create_placement_x_overflow_is_clamped(self):
        # bed is 8ft wide, default footprint 1ft; x=8 → clamped to 7
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 8, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertAlmostEqual(res.data["x"], 7.0)

    def test_create_placement_y_overflow_is_clamped(self):
        # bed is 4ft long, default footprint 1ft; y=4 → clamped to 3
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 0, "y": 4},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertAlmostEqual(res.data["y"], 3.0)

    def test_create_placement_rejected_when_footprint_too_large(self):
        # footprint 9ft wide, bed only 8ft — item cannot fit
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 0, "y": 0, "width": 9, "height": 1},
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


class CompanionHintsViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice_ch", password="testpass123")
        self.other = User.objects.create_user(username="bob_ch", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)

        plants = list(Plant.objects.order_by("id")[:2])
        if str(plants[0].id) < str(plants[1].id):
            self.plant_a, self.plant_b = plants[0], plants[1]
        else:
            self.plant_a, self.plant_b = plants[1], plants[0]

        self.companion = CompanionPlanting.objects.create(
            plant_a=self.plant_a,
            plant_b=self.plant_b,
            relationship=CompanionPlanting.Relationship.BENEFICIAL,
            notes="Test pair",
        )

    def _url(self, garden_id=None, bed_id=None):
        return reverse("companion-hints", kwargs={
            "garden_id": garden_id or self.garden.id,
            "bed_id": bed_id or self.bed.id,
        })

    def test_returns_empty_when_no_plants_in_bed(self):
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_returns_empty_when_only_one_plant_of_pair_in_bed(self):
        UserPlant.objects.create(bed=self.bed, plant=self.plant_a, status="planted")
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_returns_hint_when_both_plants_in_bed(self):
        UserPlant.objects.create(bed=self.bed, plant=self.plant_a, status="planted")
        UserPlant.objects.create(bed=self.bed, plant=self.plant_b, status="planted")
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["relationship"], "beneficial")
        self.assertEqual(res.data[0]["plant_a_name"], self.plant_a.common_name)
        self.assertEqual(res.data[0]["plant_b_name"], self.plant_b.common_name)

    def test_returns_404_for_other_users_bed(self):
        other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        other_bed = GardenBed.objects.create(name="Bob's Bed", garden=other_garden, length=4, width=8)
        res = self.client.get(self._url(other_garden.id, other_bed.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CalendarViewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)
        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        self.plant = Plant.objects.first()

    def _url(self, year=2026, garden_id=None):
        url = reverse("calendar") + f"?year={year}"
        if garden_id:
            url += f"&garden_id={garden_id}"
        return url

    def _make_plant(self, start_date, bed=None):
        return UserPlant.objects.create(
            bed=bed or self.bed, plant=self.plant, status="growing", start_date=start_date
        )

    # --- Auth ---

    def test_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self._url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Filtering ---

    def test_returns_plant_started_in_target_year(self):
        self._make_plant("2026-03-01")
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_returns_plant_started_before_target_year(self):
        self._make_plant("2025-06-01")
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_excludes_plant_started_after_target_year(self):
        self._make_plant("2027-01-01")
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_excludes_plant_without_start_date(self):
        self._make_plant(None)
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_does_not_return_other_users_plants(self):
        other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        other_bed = GardenBed.objects.create(name="Bob's Bed", garden=other_garden, length=4, width=8)
        UserPlant.objects.create(bed=other_bed, plant=self.plant, status="growing", start_date="2026-01-01")
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_filters_by_garden_id(self):
        garden2 = Garden.objects.create(name="Garden 2", owner=self.user)
        bed2 = GardenBed.objects.create(name="Bed 2", garden=garden2, length=4, width=8)
        self._make_plant("2026-01-01")
        self._make_plant("2026-01-01", bed=bed2)
        res = self.client.get(self._url(year=2026, garden_id=self.garden.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["garden_name"], "Alice's Garden")

    # --- Response shape ---

    def test_returns_nested_observations(self):
        up = self._make_plant("2026-01-01")
        Observation.objects.create(
            user_plant=up, observed_date="2026-03-01", type=Observation.Type.HARVEST
        )
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data[0]["observations"]), 1)
        self.assertEqual(res.data[0]["observations"][0]["type"], "harvest")

    def test_response_includes_expected_fields(self):
        self._make_plant("2026-05-01")
        res = self.client.get(self._url(year=2026))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data[0]
        expected_fields = (
            "id", "bed", "bed_name", "garden_id", "garden_name",
            "plant_name", "start_date", "status", "observations",
        )
        for field in expected_fields:
            self.assertIn(field, data)


class StartDateSignalTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.garden = Garden.objects.create(name="Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed", garden=self.garden, length=4, width=8)
        self.plant = Plant.objects.first()
        self.user_plant = UserPlant.objects.create(
            bed=self.bed, plant=self.plant, status="planned", start_date=None
        )

    def _make_obs(self, date, new_status="planned", obs_type=Observation.Type.STATUS_CHANGE):
        return Observation.objects.create(
            user_plant=self.user_plant,
            observed_date=date,
            type=obs_type,
            new_status=new_status,
        )

    def _start_date(self):
        self.user_plant.refresh_from_db()
        return self.user_plant.start_date

    def test_creating_status_change_sets_start_date(self):
        self._make_obs("2026-03-01")
        self.assertEqual(str(self._start_date()), "2026-03-01")

    def test_earlier_observation_updates_start_date(self):
        self._make_obs("2026-03-01")
        self._make_obs("2026-01-15")
        self.assertEqual(str(self._start_date()), "2026-01-15")

    def test_deleting_earliest_recalculates_to_next(self):
        obs_jan = self._make_obs("2026-01-15")
        self._make_obs("2026-03-01")
        obs_jan.delete()
        self.assertEqual(str(self._start_date()), "2026-03-01")

    def test_deleting_only_observation_sets_start_date_null(self):
        obs = self._make_obs("2026-03-01")
        obs.delete()
        self.assertIsNone(self._start_date())

    def test_non_status_change_observation_does_not_affect_start_date(self):
        self._make_obs("2026-03-01")
        self._make_obs("2026-01-01", obs_type=Observation.Type.HARVEST)
        self.assertEqual(str(self._start_date()), "2026-03-01")
