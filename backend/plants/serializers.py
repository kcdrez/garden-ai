import math
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from gardens.models import GardenBed

from .models import Observation, Plant, PlantPlacement, UserPlant

_UNIT_TO_FEET = {
    "ft": 1.0,
    "in": 1 / 12,
    "cm": 1 / 30.48,
    "m": 3.28084,
}


def bed_grid_dimensions(bed):
    factor = _UNIT_TO_FEET.get(bed.unit, 1.0)
    cols = math.ceil(bed.width * factor)
    rows = math.ceil(bed.length * factor)
    return cols, rows


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
    placement_id = serializers.SerializerMethodField()

    def get_placement_id(self, obj):
        try:
            return str(obj.placement.id)
        except PlantPlacement.DoesNotExist:
            return None

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
            "placement_id",
            "variety",
            "start_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "bed_name", "garden_id", "garden_name", "plant_name", "plant_category", "placement_id", "created_at", "updated_at"]
        extra_kwargs = {"bed": {"required": False}}

    def _local_date(self):
        user = self.context["request"].user
        try:
            tz_name = user.userprofile.timezone
            user_tz = ZoneInfo(tz_name)
        except (AttributeError, ZoneInfoNotFoundError):
            user_tz = ZoneInfo("UTC")
        return datetime.now(tz=user_tz).date()

    def _record_status_change(self, user_plant, previous_status, new_status):
        Observation.objects.create(
            user_plant=user_plant,
            observed_date=self._local_date(),
            type=Observation.Type.STATUS_CHANGE,
            previous_status=previous_status or "",
            new_status=new_status,
        )

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._record_status_change(instance, None, instance.status)
        return instance

    def update(self, instance, validated_data):
        old_bed = instance.bed
        old_status = instance.status
        instance = super().update(instance, validated_data)
        if instance.bed != old_bed:
            PlantPlacement.objects.filter(user_plant=instance).delete()
        if old_status != instance.status:
            self._record_status_change(instance, old_status, instance.status)
        return instance


class PlantPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantPlacement
        fields = ["id", "user_plant", "bed", "x", "y", "width", "height", "created_at", "updated_at"]
        read_only_fields = ["id", "bed", "created_at", "updated_at"]

    def validate_user_plant(self, value):
        request = self.context.get("request")
        if not UserPlant.objects.filter(pk=value.pk, bed__garden__owner=request.user).exists():
            raise serializers.ValidationError("Plant not found.")
        return value

    def validate(self, data):
        user_plant = data.get("user_plant") or (self.instance.user_plant if self.instance else None)
        bed = self.instance.bed if self.instance else user_plant.bed
        cols, rows = bed_grid_dimensions(bed)

        x = data.get("x", self.instance.x if self.instance else None)
        y = data.get("y", self.instance.y if self.instance else None)
        width = data.get("width", self.instance.width if self.instance else 1)
        height = data.get("height", self.instance.height if self.instance else 1)

        if x is not None and (x < 0 or x + width > cols):
            raise serializers.ValidationError({"x": f"Out of bounds (grid is {cols} columns wide)."})
        if y is not None and (y < 0 or y + height > rows):
            raise serializers.ValidationError({"y": f"Out of bounds (grid is {rows} rows tall)."})

        return data


class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = [
            "id",
            "user_plant",
            "observed_date",
            "type",
            "note",
            "previous_status",
            "new_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_plant", "previous_status", "created_at", "updated_at"]
