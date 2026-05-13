from rest_framework import permissions, viewsets

from .models import Garden
from .serializers import GardenSerializer


class GardenViewSet(viewsets.ModelViewSet):
    serializer_class = GardenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # return only gardens owned by the requesting user, newest first
        return Garden.objects.filter(owner=self.request.user).order_by("-created_at")
