from django.db import transaction
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response

from gardens.models import Garden, GardenBed

from .models import Observation, Plant, PlantPlacement, UserPlant
from .serializers import (
    ObservationSerializer,
    ObservationUpdateSerializer,
    PlantPlacementSerializer,
    PlantSerializer,
    UserPlantSerializer,
)


class BedScopedMixin:
    def _get_bed(self):
        try:
            garden = Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
            return GardenBed.objects.get(pk=self.kwargs["bed_id"], garden=garden)
        except (Garden.DoesNotExist, GardenBed.DoesNotExist) as err:
            raise NotFound("Bed not found.") from err


class PlantViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PlantSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Plant.objects.all()


class UserPlantViewSet(BedScopedMixin, viewsets.ModelViewSet):
    serializer_class = UserPlantSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "plant_id"

    def get_queryset(self):
        bed = self._get_bed()
        return (
            UserPlant.objects.filter(bed=bed)
            .select_related("plant", "bed__garden")
            .order_by("plant__common_name", "-created_at")
        )

    def create(self, request, *args, **kwargs):
        try:
            quantity = max(1, min(int(request.data.get("quantity", 1)), 50))
        except (TypeError, ValueError):
            quantity = 1

        bed = self._get_bed()
        instances = []

        with transaction.atomic():
            for _ in range(quantity):
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save(bed=bed)
                instances.append(serializer.data)

        return Response(instances, status=status.HTTP_201_CREATED)


class AllUserPlantsViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = UserPlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            UserPlant.objects.filter(bed__garden__owner=self.request.user)
            .select_related("plant", "bed__garden")
            .order_by("bed__garden__name", "bed__name", "plant__common_name", "-created_at")
        )


class PlantPlacementViewSet(
    BedScopedMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PlantPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "placement_id"

    def get_queryset(self):
        bed = self._get_bed()
        return PlantPlacement.objects.filter(bed=bed).select_related("user_plant__plant")

    def perform_create(self, serializer):
        bed = self._get_bed()
        user_plant = serializer.validated_data["user_plant"]
        if user_plant.bed != bed:
            raise ValidationError({"user_plant": "This plant does not belong to this bed."})
        serializer.save(bed=bed)


class ObservationViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "observation_id"

    def get_serializer_class(self):
        if self.action == "partial_update":
            return ObservationUpdateSerializer
        return ObservationSerializer

    def _get_user_plant(self):
        try:
            garden = Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
            bed = GardenBed.objects.get(pk=self.kwargs["bed_id"], garden=garden)
            return UserPlant.objects.get(pk=self.kwargs["plant_id"], bed=bed)
        except (Garden.DoesNotExist, GardenBed.DoesNotExist, UserPlant.DoesNotExist) as err:
            raise NotFound("Plant not found.") from err

    def get_queryset(self):
        user_plant = self._get_user_plant()
        return Observation.objects.filter(user_plant=user_plant)

    def perform_create(self, serializer):
        user_plant = self._get_user_plant()
        serializer.save(user_plant=user_plant)
