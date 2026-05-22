from django.db.models import Count
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import NotFound

from .models import BedPlacement, Garden, GardenBed
from .serializers import BedPlacementSerializer, GardenBedSerializer, GardenSerializer


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
