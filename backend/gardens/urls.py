from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AllGardenBedsViewSet, GardenBedViewSet, GardenViewSet

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")

bed_list = GardenBedViewSet.as_view({"get": "list", "post": "create"})
bed_detail = GardenBedViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)
all_beds = AllGardenBedsViewSet.as_view({"get": "list"})

urlpatterns = router.urls + [
    path("beds/", all_beds, name="all-beds"),
    path("gardens/<uuid:garden_id>/beds/", bed_list, name="garden-beds-list"),
    path("gardens/<uuid:garden_id>/beds/<uuid:pk>/", bed_detail, name="garden-beds-detail"),
]
