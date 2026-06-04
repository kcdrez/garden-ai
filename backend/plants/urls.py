from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AllUserPlantsViewSet,
    CompanionHintsViewSet,
    ObservationViewSet,
    PlantPlacementViewSet,
    PlantViewSet,
    UserPlantViewSet,
)

router = DefaultRouter()
router.register(r"plants", PlantViewSet, basename="plant")

user_plant_list = UserPlantViewSet.as_view({"get": "list", "post": "create"})
user_plant_detail = UserPlantViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)
user_plant_clone = UserPlantViewSet.as_view({"post": "clone"})
all_user_plants = AllUserPlantsViewSet.as_view({"get": "list"})
all_user_plant_detail = AllUserPlantsViewSet.as_view({"get": "retrieve"})
companion_hints = CompanionHintsViewSet.as_view({"get": "list"})
observation_list = ObservationViewSet.as_view({"get": "list", "post": "create"})
observation_detail = ObservationViewSet.as_view({"patch": "partial_update", "delete": "destroy"})
placement_list = PlantPlacementViewSet.as_view({"get": "list", "post": "create"})
placement_detail = PlantPlacementViewSet.as_view({"patch": "partial_update", "delete": "destroy"})

urlpatterns = [*router.urls,
    path("userplants/", all_user_plants, name="all-user-plants"),
    path("userplants/<uuid:pk>/", all_user_plant_detail, name="all-user-plant-detail"),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/",
        user_plant_list,
        name="user-plants-list",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/<uuid:plant_id>/",
        user_plant_detail,
        name="user-plants-detail",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/<uuid:plant_id>/clone/",
        user_plant_clone,
        name="user-plant-clone",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/<uuid:plant_id>/observations/",
        observation_list,
        name="observations-list",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/<uuid:plant_id>/observations/<uuid:observation_id>/",
        observation_detail,
        name="observations-detail",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/companion-hints/",
        companion_hints,
        name="companion-hints",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/placements/",
        placement_list,
        name="placements-list",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/placements/<uuid:placement_id>/",
        placement_detail,
        name="placements-detail",
    ),
]
