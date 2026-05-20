from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from gardens.models import GardenBed

from .models import Observation, Plant, UserPlant


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
            "start_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "bed_name", "garden_id", "garden_name", "plant_name", "plant_category", "created_at", "updated_at"]
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
            type="status_change",
            previous_status=previous_status or "",
            new_status=new_status,
        )

    def create(self, validated_data):
        instance = super().create(validated_data)
        self._record_status_change(instance, None, instance.status)
        return instance

    def update(self, instance, validated_data):
        old_status = instance.status
        instance = super().update(instance, validated_data)
        if old_status != instance.status:
            self._record_status_change(instance, old_status, instance.status)
        return instance


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
