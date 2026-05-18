from rest_framework import serializers

from .models import Garden, GardenBed


class GardenBedSerializer(serializers.ModelSerializer):
    garden_name = serializers.CharField(source="garden.name", read_only=True)

    class Meta:
        model = GardenBed
        fields = [
            "id", "garden", "garden_name", "name", "length", "width", "depth", "unit",
            "facing", "avg_sunlight_hours", "soil_type", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "garden", "garden_name", "created_at", "updated_at"]


class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
            "owner",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        return super().create(validated_data)
