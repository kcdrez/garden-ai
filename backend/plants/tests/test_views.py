from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden, GardenBed
from plants.models import Plant, PlantPlacement, UserPlant


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
        self.assertEqual(res.data["plant_name"], self.plant.common_name)

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

    def test_move_plant_to_other_users_bed_is_rejected(self):
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id, self.user_plant.id),
            {"bed": str(self.other_bed.id)},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

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
        # bed is 8ft wide = 8 columns (0–7); x=8 is out of bounds
        res = self.client.post(
            self._list_url(),
            {"userPlant": str(self.user_plant.id), "x": 8, "y": 0},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_placement(self):
        placement = PlantPlacement.objects.create(
            user_plant=self.user_plant, bed=self.bed, x=0, y=0
        )
        res = self.client.delete(self._detail_url(placement.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlantPlacement.objects.filter(id=placement.id).exists())
