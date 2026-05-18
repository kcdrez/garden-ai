from rest_framework import serializers

from gardens.models import GardenBed

from .models import Plant, UserPlant


class PlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = ["id", "common_name", "scientific_name", "category", "description"]
        read_only_fields = ["id"]


class UserPlantSerializer(serializers.ModelSerializer):
    plant_name = serializers.CharField(source="plant.common_name", read_only=True)
    plant_category = serializers.CharField(source="plant.category", read_only=True)
    bed_name = serializers.CharField(source="bed.name", read_only=True)
    garden_id = serializers.UUIDField(source="bed.garden.id", read_only=True)
    garden_name = serializers.CharField(source="bed.garden.name", read_only=True)

    def validate_bed(self, value):
        request = self.context.get("request")
        if not GardenBed.objects.filter(pk=value.pk, garden__owner=request.user).exists():
            raise serializers.ValidationError("Bed not found.")
        return value

    class Meta:
        model = UserPlant
        fields = [
            "id",
            "bed",
            "bed_name",
            "garden_id",
            "garden_name",
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
        read_only_fields = ["id", "bed_name", "garden_id", "garden_name", "plant_name", "plant_category", "created_at", "updated_at"]
        extra_kwargs = {"bed": {"required": False}}
