from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import Garden, GardenBed


class GardenAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)

    # --- Authentication ---

    def test_list_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse("garden-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- List ---

    def test_list_returns_only_own_gardens(self):
        res = self.client.get(reverse("garden-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [g["id"] for g in res.data]
        self.assertIn(str(self.garden.id), ids)
        self.assertNotIn(str(self.other_garden.id), ids)

    # --- Create ---

    def test_create_garden(self):
        res = self.client.post(reverse("garden-list"), {"name": "New Garden"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "New Garden")

    def test_create_sets_correct_owner(self):
        res = self.client.post(reverse("garden-list"), {"name": "Test"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        garden = Garden.objects.get(id=res.data["id"])
        self.assertEqual(garden.owner, self.user)

    def test_create_requires_name(self):
        res = self.client.post(reverse("garden-list"), {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Retrieve ---

    def test_retrieve_own_garden(self):
        res = self.client.get(reverse("garden-detail", kwargs={"pk": self.garden.id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], self.garden.name)

    def test_retrieve_other_users_garden_returns_404(self):
        res = self.client.get(reverse("garden-detail", kwargs={"pk": self.other_garden.id}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Update ---

    def test_patch_own_garden(self):
        res = self.client.patch(
            reverse("garden-detail", kwargs={"pk": self.garden.id}),
            {"name": "Updated Name"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Updated Name")

    def test_patch_other_users_garden_returns_404(self):
        res = self.client.patch(
            reverse("garden-detail", kwargs={"pk": self.other_garden.id}),
            {"name": "Stolen"},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Delete ---

    def test_delete_own_garden(self):
        res = self.client.delete(reverse("garden-detail", kwargs={"pk": self.garden.id}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Garden.objects.filter(id=self.garden.id).exists())

    def test_delete_other_users_garden_returns_404(self):
        res = self.client.delete(reverse("garden-detail", kwargs={"pk": self.other_garden.id}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Garden.objects.filter(id=self.other_garden.id).exists())


class GardenBedAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        self.bed = GardenBed.objects.create(
            name="Raised Bed 1", garden=self.garden, length=4, width=8
        )

    def _list_url(self, garden_id):
        return reverse("garden-beds-list", kwargs={"garden_id": garden_id})

    def _detail_url(self, garden_id, bed_id):
        return reverse("garden-beds-detail", kwargs={"garden_id": garden_id, "bed_id": bed_id})

    # --- List ---

    def test_list_beds_in_own_garden(self):
        res = self.client.get(self._list_url(self.garden.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_beds_in_other_users_garden_returns_404(self):
        res = self.client.get(self._list_url(self.other_garden.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Create ---

    def test_create_bed(self):
        res = self.client.post(
            self._list_url(self.garden.id),
            {"name": "New Bed", "length": 4, "width": 8},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "New Bed")

    def test_create_bed_in_other_users_garden_returns_404(self):
        res = self.client.post(
            self._list_url(self.other_garden.id),
            {"name": "Stolen Bed", "length": 4, "width": 8},
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_bed_requires_length_and_width(self):
        res = self.client.post(self._list_url(self.garden.id), {"name": "Bad Bed"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Retrieve ---

    def test_retrieve_own_bed(self):
        res = self.client.get(self._detail_url(self.garden.id, self.bed.id))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], self.bed.name)

    # --- Update ---

    def test_patch_own_bed(self):
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id),
            {"name": "Updated Bed"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Updated Bed")

    # --- Delete ---

    def test_delete_own_bed(self):
        res = self.client.delete(self._detail_url(self.garden.id, self.bed.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GardenBed.objects.filter(id=self.bed.id).exists())

    # --- Resize validation ---

    def test_resize_blocked_when_plant_out_of_bounds(self):
        from plants.models import Plant, PlantPlacement, UserPlant

        plant = Plant.objects.first()
        user_plant = UserPlant.objects.create(bed=self.bed, plant=plant, status="planted")
        # place at column 6 in an 8-wide (ft) bed — valid now, out of bounds if shrunk to 4
        PlantPlacement.objects.create(user_plant=user_plant, bed=self.bed, x=6, y=0)

        res = self.client.patch(self._detail_url(self.garden.id, self.bed.id), {"width": 4})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resize_allowed_when_no_placements_conflict(self):
        res = self.client.patch(self._detail_url(self.garden.id, self.bed.id), {"width": 6})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
