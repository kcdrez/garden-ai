from rest_framework import serializers

from .models import Plant, UserPlant


class PlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = ["id", "common_name", "scientific_name", "category", "description"]
        read_only_fields = ["id"]


class UserPlantSerializer(serializers.ModelSerializer):
    plant_name = serializers.CharField(source="plant.common_name", read_only=True)
    plant_category = serializers.CharField(source="plant.category", read_only=True)

    class Meta:
        model = UserPlant
        fields = [
            "id",
            "bed",
            "plant",
            "plant_name",
            "plant_category",
            "variety",
            "planted_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "bed", "plant_name", "plant_category", "created_at", "updated_at"]
