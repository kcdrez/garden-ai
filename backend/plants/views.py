from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import NotFound

from gardens.models import Garden, GardenBed

from .models import Plant, UserPlant
from .serializers import PlantSerializer, UserPlantSerializer


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
