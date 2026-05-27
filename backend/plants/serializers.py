from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from core.utils import to_feet
from gardens.models import GardenBed

from .models import Observation, Plant, PlantPlacement, UserPlant


class PlantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plant
        fields = ["id", "common_name", "scientific_name", "category", "description", "default_spacing_ft"]
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
        read_only_fields = [
            "id", "bed_name", "garden_id", "garden_name", "plant_name",
            "plant_category", "placement_id", "created_at", "updated_at",
        ]
        extra_kwargs = {"bed": {"required": False}}

    def _local_date(self):
        user = self.context["request"].user
        try:
            tz_name = user.userprofile.timezone
            user_tz = ZoneInfo(tz_name)
        except (AttributeError, ZoneInfoNotFoundError):
            user_tz = ZoneInfo("UTC")
        return datetime.now(tz=user_tz).date()

    def _record_status_change(self, user_plant, previous_status, new_status, observed_date=None):
        Observation.objects.create(
            user_plant=user_plant,
            observed_date=observed_date or self._local_date(),
            type=Observation.Type.STATUS_CHANGE,
            previous_status=previous_status or "",
            new_status=new_status,
        )

    def _record_transplant(self, user_plant, old_bed):
        Observation.objects.create(
            user_plant=user_plant,
            observed_date=self._local_date(),
            type=Observation.Type.TRANSPLANT,
            note=f"Moved from {old_bed.name} to {user_plant.bed.name}",
        )

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._record_status_change(instance, None, instance.status, observed_date=instance.start_date)
        return instance

    def update(self, instance, validated_data):
        old_bed = instance.bed
        old_status = instance.status
        instance = super().update(instance, validated_data)
        if instance.bed != old_bed:
            PlantPlacement.objects.filter(user_plant=instance).delete()
            self._record_transplant(instance, old_bed)
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
        bed_width_ft = to_feet(bed.width, bed.unit)
        bed_height_ft = to_feet(bed.length, bed.unit)

        x = data.get("x", self.instance.x if self.instance else None)
        y = data.get("y", self.instance.y if self.instance else None)
        width = data.get("width", self.instance.width if self.instance else 1.0)
        height = data.get("height", self.instance.height if self.instance else 1.0)

        if x is not None and (x < 0 or x + width > bed_width_ft):
            raise serializers.ValidationError({"x": f"Out of bounds (bed is {bed_width_ft} ft wide)."})
        if y is not None and (y < 0 or y + height > bed_height_ft):
            raise serializers.ValidationError({"y": f"Out of bounds (bed is {bed_height_ft} ft tall)."})

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


class ObservationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = ["id", "observed_date", "note"]
        read_only_fields = ["id"]
