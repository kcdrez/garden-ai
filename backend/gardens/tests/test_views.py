from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from gardens.models import BedPlacement, Garden, GardenBed, GardenFeaturePlacement


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

    # --- Resize validation ---

    def test_resize_garden_blocked_when_bed_placement_out_of_bounds(self):
        garden = Garden.objects.create(name="Grid Garden", owner=self.user, length=20, width=20)
        bed = GardenBed.objects.create(name="Far Bed", garden=garden, length=4, width=8)
        BedPlacement.objects.create(bed=bed, garden=garden, x=15, y=0)
        res = self.client.patch(
            reverse("garden-detail", kwargs={"pk": garden.id}),
            {"width": 10},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resize_garden_allowed_when_no_bed_placement_conflict(self):
        garden = Garden.objects.create(name="Grid Garden", owner=self.user, length=20, width=20)
        res = self.client.patch(
            reverse("garden-detail", kwargs={"pk": garden.id}),
            {"width": 15},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_clear_garden_dimensions_blocked_when_placements_exist(self):
        garden = Garden.objects.create(name="Grid Garden", owner=self.user, length=20, width=20)
        bed = GardenBed.objects.create(name="Bed", garden=garden, length=4, width=8)
        BedPlacement.objects.create(bed=bed, garden=garden, x=0, y=0)
        res = self.client.patch(
            reverse("garden-detail", kwargs={"pk": garden.id}),
            {"length": None},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


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

    def test_resize_accepts_float_dimensions(self):
        res = self.client.patch(
            self._detail_url(self.garden.id, self.bed.id),
            {"width": 4.5, "length": 3.7},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.bed.refresh_from_db()
        self.assertAlmostEqual(self.bed.width, 4.5)
        self.assertAlmostEqual(self.bed.length, 3.7)


class AllGardenBedsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other)
        GardenBed.objects.create(name="Bob's Bed", garden=other_garden, length=4, width=8)

    def test_list_all_own_beds(self):
        res = self.client.get(reverse("all-beds"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], str(self.bed.id))

    def test_list_excludes_other_users_beds(self):
        res = self.client.get(reverse("all-beds"))
        ids = [b["id"] for b in res.data]
        self.assertNotIn(str(self.other), ids)


class BedPlacementAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user, length=20, width=20)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)

        other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other, length=20, width=20)
        self.other_bed = GardenBed.objects.create(
            name="Bob's Bed", garden=other_garden, length=4, width=8
        )

    def _list_url(self, garden=None):
        g = garden or self.garden
        return reverse("bed-placements-list", kwargs={"garden_id": g.id})

    def _detail_url(self, placement_id):
        return reverse(
            "bed-placements-detail",
            kwargs={"garden_id": self.garden.id, "bed_placement_id": placement_id},
        )

    def test_list_bed_placements(self):
        res = self.client.get(self._list_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_create_bed_placement(self):
        res = self.client.post(self._list_url(), {"bed": str(self.bed.id), "x": 0, "y": 0})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_bed_placement_x_overflow_is_clamped(self):
        # garden 20ft wide, bed 8ft wide; x=20 → clamped to 12
        res = self.client.post(self._list_url(), {"bed": str(self.bed.id), "x": 20, "y": 0})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertAlmostEqual(res.data["x"], 12.0)

    def test_create_bed_placement_y_overflow_is_clamped(self):
        # garden 20ft tall, bed 4ft long; y=20 → clamped to 16
        res = self.client.post(self._list_url(), {"bed": str(self.bed.id), "x": 0, "y": 20})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertAlmostEqual(res.data["y"], 16.0)

    def test_create_bed_placement_rejected_when_bed_too_large(self):
        # bed 25ft wide, garden only 20ft — bed cannot fit
        huge_bed = GardenBed.objects.create(name="Huge Bed", garden=self.garden, length=4, width=25)
        res = self.client.post(self._list_url(), {"bed": str(huge_bed.id), "x": 0, "y": 0})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_bed_placement_invalid_bed_rejected(self):
        # other_bed belongs to Bob's garden, not Alice's
        res = self.client.post(self._list_url(), {"bed": str(self.other_bed.id), "x": 0, "y": 0})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_bed_placement_garden_no_dimensions_rejected(self):
        garden = Garden.objects.create(name="No Dims", owner=self.user)
        bed = GardenBed.objects.create(name="Bed", garden=garden, length=4, width=8)
        res = self.client.post(self._list_url(garden=garden), {"bed": str(bed.id), "x": 0, "y": 0})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_bed_placement(self):
        placement = BedPlacement.objects.create(
            bed=self.bed, garden=self.garden, x=0, y=0
        )
        res = self.client.delete(self._detail_url(placement.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(BedPlacement.objects.filter(id=placement.id).exists())


class GardenFeaturePlacementAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.other = User.objects.create_user(username="bob", password="testpass123")
        self.client.force_authenticate(user=self.user)

        self.garden = Garden.objects.create(name="Alice's Garden", owner=self.user, length=20, width=20)
        self.bed = GardenBed.objects.create(name="Bed 1", garden=self.garden, length=4, width=8)
        self.other_garden = Garden.objects.create(name="Bob's Garden", owner=self.other, length=20, width=20)
        self.other_bed = GardenBed.objects.create(name="Bob's Bed", garden=self.other_garden, length=4, width=8)

    def _garden_list_url(self):
        return reverse("garden-features-list", kwargs={"garden_id": self.garden.id})

    def _garden_detail_url(self, feature_id):
        return reverse(
            "garden-features-detail",
            kwargs={"garden_id": self.garden.id, "feature_placement_id": feature_id},
        )

    def _bed_list_url(self):
        return reverse("bed-features-list", kwargs={"garden_id": self.garden.id, "bed_id": self.bed.id})

    def _bed_detail_url(self, feature_id):
        return reverse(
            "bed-features-detail",
            kwargs={"garden_id": self.garden.id, "bed_id": self.bed.id, "feature_placement_id": feature_id},
        )

    def _make_garden_feature(self, **kwargs):
        return GardenFeaturePlacement.objects.create(
            user=self.user, garden=self.garden,
            object_type="shed", x=1, y=1, width=2, height=2,
            **kwargs,
        )

    def _make_bed_feature(self, **kwargs):
        return GardenFeaturePlacement.objects.create(
            user=self.user, bed=self.bed,
            object_type="trellis", x=0, y=0, width=1, height=1,
            **kwargs,
        )

    # --- Garden-scoped: list ---

    def test_list_garden_features(self):
        self._make_garden_feature()
        res = self.client.get(self._garden_list_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_garden_features_other_user_returns_404(self):
        res = self.client.get(
            reverse("garden-features-list", kwargs={"garden_id": self.other_garden.id})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_excludes_other_users_features(self):
        self._make_garden_feature()
        GardenFeaturePlacement.objects.create(
            user=self.other, garden=self.other_garden,
            object_type="bench", x=0, y=0, width=1, height=1,
        )
        res = self.client.get(self._garden_list_url())
        self.assertEqual(len(res.data), 1)

    # --- Garden-scoped: create ---

    def test_create_garden_feature(self):
        res = self.client.post(
            self._garden_list_url(),
            {"objectType": "shed", "x": 1, "y": 1, "width": 2, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["object_type"], "shed")
        self.assertEqual(res.data["shape"], "rect")

    def test_create_garden_feature_shape_is_computed(self):
        res = self.client.post(
            self._garden_list_url(),
            {"objectType": "fountain", "x": 0, "y": 0, "width": 2, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["shape"], "circle")

    def test_create_custom_feature_requires_label(self):
        res = self.client.post(
            self._garden_list_url(),
            {"objectType": "custom_rect", "x": 0, "y": 0, "width": 2, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_custom_feature_with_label_succeeds(self):
        res = self.client.post(
            self._garden_list_url(),
            {"objectType": "custom_rect", "label": "Fairy Garden", "x": 0, "y": 0, "width": 2, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["label"], "Fairy Garden")

    def test_create_garden_feature_in_other_users_garden_returns_404(self):
        res = self.client.post(
            reverse("garden-features-list", kwargs={"garden_id": self.other_garden.id}),
            {"objectType": "shed", "x": 0, "y": 0, "width": 2, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Garden-scoped: update & delete ---

    def test_patch_garden_feature_position(self):
        feature = self._make_garden_feature()
        res = self.client.patch(
            self._garden_detail_url(feature.id),
            {"x": 5, "y": 3},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertAlmostEqual(feature.x, 5)
        self.assertAlmostEqual(feature.y, 3)

    def test_patch_garden_feature_size(self):
        feature = self._make_garden_feature()
        res = self.client.patch(
            self._garden_detail_url(feature.id),
            {"width": 4, "height": 3},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertAlmostEqual(feature.width, 4)
        self.assertAlmostEqual(feature.height, 3)

    def test_delete_garden_feature(self):
        feature = self._make_garden_feature()
        res = self.client.delete(self._garden_detail_url(feature.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GardenFeaturePlacement.objects.filter(id=feature.id).exists())

    def test_delete_other_users_garden_feature_returns_404(self):
        feature = GardenFeaturePlacement.objects.create(
            user=self.other, garden=self.other_garden,
            object_type="shed", x=0, y=0, width=2, height=2,
        )
        res = self.client.delete(
            reverse("garden-features-detail", kwargs={
                "garden_id": self.other_garden.id,
                "feature_placement_id": feature.id,
            })
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(GardenFeaturePlacement.objects.filter(id=feature.id).exists())

    # --- Bed-scoped: list ---

    def test_list_bed_features(self):
        self._make_bed_feature()
        res = self.client.get(self._bed_list_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_list_bed_features_other_users_garden_returns_404(self):
        res = self.client.get(
            reverse("bed-features-list", kwargs={
                "garden_id": self.other_garden.id,
                "bed_id": self.other_bed.id,
            })
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Bed-scoped: create ---

    def test_create_bed_feature(self):
        res = self.client.post(
            self._bed_list_url(),
            {"objectType": "trellis", "x": 0, "y": 0, "width": 1, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["object_type"], "trellis")
        self.assertEqual(res.data["shape"], "rect")

    def test_create_bed_feature_in_other_users_bed_returns_404(self):
        res = self.client.post(
            reverse("bed-features-list", kwargs={
                "garden_id": self.other_garden.id,
                "bed_id": self.other_bed.id,
            }),
            {"objectType": "trellis", "x": 0, "y": 0, "width": 1, "height": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- Bed-scoped: update & delete ---

    def test_patch_bed_feature(self):
        feature = self._make_bed_feature()
        res = self.client.patch(
            self._bed_detail_url(feature.id),
            {"x": 2, "y": 1},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertAlmostEqual(feature.x, 2)

    def test_delete_bed_feature(self):
        feature = self._make_bed_feature()
        res = self.client.delete(self._bed_detail_url(feature.id))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GardenFeaturePlacement.objects.filter(id=feature.id).exists())

    # --- Model ---

    def test_garden_feature_str(self):
        feature = self._make_garden_feature()
        self.assertIn("shed", str(feature).lower())

    def test_check_constraint_requires_exactly_one_scope(self):
        from django.db import IntegrityError, transaction
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                GardenFeaturePlacement.objects.create(
                    user=self.user,
                    garden=self.garden,
                    bed=self.bed,
                    object_type="shed",
                    x=0, y=0, width=1, height=1,
                )


class GardenModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.garden = Garden.objects.create(name="Test Garden", owner=self.user)
        self.bed = GardenBed.objects.create(
            name="Test Bed", garden=self.garden, length=4, width=8
        )

    def test_garden_str(self):
        self.assertEqual(str(self.garden), "Test Garden")

    def test_garden_bed_str(self):
        self.assertEqual(str(self.bed), "Test Bed (Test Garden)")

    def test_bed_placement_str(self):
        placement = BedPlacement.objects.create(
            bed=self.bed, garden=self.garden, x=2, y=3
        )
        self.assertEqual(str(placement), "Test Bed (Test Garden) @ (2, 3)")
