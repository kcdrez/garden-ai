from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PlantViewSet, UserPlantViewSet

router = DefaultRouter()
router.register(r"plants", PlantViewSet, basename="plant")

user_plant_list = UserPlantViewSet.as_view({"get": "list", "post": "create"})
user_plant_detail = UserPlantViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = router.urls + [
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
