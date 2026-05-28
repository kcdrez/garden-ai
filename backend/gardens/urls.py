from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AllGardenBedsViewSet, BedPlacementViewSet, GardenBedViewSet, GardenViewSet

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")

bed_list = GardenBedViewSet.as_view({"get": "list", "post": "create"})
bed_detail = GardenBedViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)
all_beds = AllGardenBedsViewSet.as_view({"get": "list"})
bed_placement_list = BedPlacementViewSet.as_view({"get": "list", "post": "create"})
bed_placement_detail = BedPlacementViewSet.as_view({"patch": "partial_update", "delete": "destroy"})

urlpatterns = [*router.urls,
    path("beds/", all_beds, name="all-beds"),
    path("gardens/<uuid:garden_id>/beds/", bed_list, name="garden-beds-list"),
    path("gardens/<uuid:garden_id>/beds/<uuid:bed_id>/", bed_detail, name="garden-beds-detail"),
    path("gardens/<uuid:garden_id>/bed-placements/", bed_placement_list, name="bed-placements-list"),
    path(
        "gardens/<uuid:garden_id>/bed-placements/<uuid:bed_placement_id>/",
        bed_placement_detail,
        name="bed-placements-detail",
    ),
]
