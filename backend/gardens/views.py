from django.db.models import Count
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import NotFound

from .models import BedPlacement, Garden, GardenBed, GardenFeaturePlacement
from .serializers import BedPlacementSerializer, GardenBedSerializer, GardenFeaturePlacementSerializer, GardenSerializer


class GardenScopedMixin:
    def _get_garden(self):
        try:
            return Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
        except Garden.DoesNotExist as err:
            raise NotFound("Garden not found.") from err


class GardenViewSet(viewsets.ModelViewSet):
    serializer_class = GardenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Garden.objects.filter(owner=self.request.user)
            .annotate(bed_count=Count("beds"))
            .order_by("name", "-created_at")
        )


class GardenBedViewSet(GardenScopedMixin, viewsets.ModelViewSet):
    serializer_class = GardenBedSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "bed_id"

    def get_queryset(self):
        garden = self._get_garden()
        return (
            GardenBed.objects.filter(garden=garden)
            .select_related("garden")
            .annotate(plant_count=Count("user_plants"))
            .order_by("name", "-created_at")
        )

    def perform_create(self, serializer):
        garden = self._get_garden()
        serializer.save(garden=garden)


class AllGardenBedsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = GardenBedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            GardenBed.objects.filter(garden__owner=self.request.user)
            .select_related("garden")
            .annotate(plant_count=Count("user_plants"))
            .order_by("garden__name", "name", "-created_at")
        )


class BedPlacementViewSet(
    GardenScopedMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = BedPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "bed_placement_id"

    def get_queryset(self):
        garden = self._get_garden()
        return BedPlacement.objects.filter(garden=garden).select_related("bed")

    def perform_create(self, serializer):
        garden = self._get_garden()
        serializer.save(garden=garden)


class GardenFeaturePlacementViewSet(
    GardenScopedMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = GardenFeaturePlacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "feature_placement_id"

    def _get_scope(self):
        garden = self._get_garden()
        bed_id = self.kwargs.get("bed_id")
        if bed_id:
            try:
                bed = GardenBed.objects.get(pk=bed_id, garden=garden)
            except GardenBed.DoesNotExist as err:
                from rest_framework.exceptions import NotFound
                raise NotFound("Bed not found.") from err
            return garden, bed
        return garden, None

    def get_queryset(self):
        garden, bed = self._get_scope()
        if bed:
            return GardenFeaturePlacement.objects.filter(bed=bed, user=self.request.user)
        return GardenFeaturePlacement.objects.filter(garden=garden, user=self.request.user)

    def perform_create(self, serializer):
        garden, bed = self._get_scope()
        if bed:
            serializer.save(user=self.request.user, bed=bed)
        else:
            serializer.save(user=self.request.user, garden=garden)
