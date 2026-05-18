from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AllUserPlantsViewSet, PlantViewSet, UserPlantViewSet

router = DefaultRouter()
router.register(r"plants", PlantViewSet, basename="plant")

user_plant_list = UserPlantViewSet.as_view({"get": "list", "post": "create"})
user_plant_detail = UserPlantViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)
all_user_plants = AllUserPlantsViewSet.as_view({"get": "list"})

urlpatterns = router.urls + [
    path("userplants/", all_user_plants, name="all-user-plants"),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/",
        user_plant_list,
        name="user-plants-list",
    ),
    path(
        "gardens/<uuid:garden_id>/beds/<uuid:bed_id>/plants/<uuid:pk>/",
        user_plant_detail,
        name="user-plants-detail",
    ),
]
