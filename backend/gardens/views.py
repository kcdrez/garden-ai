from rest_framework import viewsets
from .models import Garden
from .serializers import GardenSerializer


class GardenViewSet(viewsets.ModelViewSet):
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer