from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import NotFound

from .models import Garden, GardenBed
from .serializers import GardenBedSerializer, GardenSerializer


class GardenViewSet(viewsets.ModelViewSet):
    serializer_class = GardenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Garden.objects.filter(owner=self.request.user).order_by("-created_at")


class GardenBedViewSet(viewsets.ModelViewSet):
    serializer_class = GardenBedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_garden(self):
        try:
            return Garden.objects.get(pk=self.kwargs["garden_id"], owner=self.request.user)
        except Garden.DoesNotExist as err:
            raise NotFound("Garden not found.") from err

    def get_queryset(self):
        garden = self._get_garden()
        return GardenBed.objects.filter(garden=garden).order_by("created_at")

    def perform_create(self, serializer):
        garden = self._get_garden()
        serializer.save(garden=garden)


class AllGardenBedsViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = GardenBedSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GardenBed.objects.filter(
            garden__owner=self.request.user
        ).order_by("garden__name", "created_at")
