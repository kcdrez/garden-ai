from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import NotFound, ValidationError

from gardens.models import Garden, GardenBed

from .models import Observation, Plant, PlantPlacement, UserPlant
from .serializers import ObservationSerializer, PlantPlacementSerializer, PlantSerializer, UserPlantSerializer


class PlantViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PlantSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Plant.objects.all()


class UserPlantViewSet(viewsets.ModelViewSet):
    serializer_class = UserPlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_bed(self):
        try:
            garden = Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
            return GardenBed.objects.get(pk=self.kwargs["bed_id"], garden=garden)
        except (Garden.DoesNotExist, GardenBed.DoesNotExist) as err:
            raise NotFound("Bed not found.") from err

    def get_queryset(self):
        bed = self._get_bed()
        return UserPlant.objects.filter(bed=bed).order_by("created_at")

    def perform_create(self, serializer):
        bed = self._get_bed()
        serializer.save(bed=bed)


class AllUserPlantsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = UserPlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPlant.objects.filter(
            bed__garden__owner=self.request.user
        ).order_by("bed__garden__name", "bed__name", "created_at")


class PlantPlacementViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PlantPlacementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_bed(self):
        try:
            garden = Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
            return GardenBed.objects.get(pk=self.kwargs["bed_id"], garden=garden)
        except (Garden.DoesNotExist, GardenBed.DoesNotExist) as err:
            raise NotFound("Bed not found.") from err

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
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ObservationSerializer
    permission_classes = [permissions.IsAuthenticated]

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
