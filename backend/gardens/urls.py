from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import GardenBedViewSet, GardenViewSet

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")

bed_list = GardenBedViewSet.as_view({"get": "list", "post": "create"})
bed_detail = GardenBedViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = router.urls + [
    path("gardens/<uuid:garden_id>/beds/", bed_list, name="garden-beds-list"),
    path("gardens/<uuid:garden_id>/beds/<uuid:pk>/", bed_detail, name="garden-beds-detail"),
]
