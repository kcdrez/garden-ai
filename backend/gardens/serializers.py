from django.db.models import ExpressionWrapper, F, FloatField, Q
from rest_framework import serializers

from core.utils import to_feet

from .models import BedPlacement, Garden, GardenBed, GardenFeaturePlacement


class GardenBedSerializer(serializers.ModelSerializer):
    garden_name = serializers.CharField(source="garden.name", read_only=True)
    plant_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = GardenBed
        fields = [
            "id", "garden", "garden_name", "name", "length", "width", "depth", "unit",
            "facing", "avg_sunlight_hours", "soil_type", "notes", "plant_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "garden", "garden_name", "plant_count", "created_at", "updated_at"]

    def validate(self, data):
        if not self.instance:
            return data

        new_length = data.get("length", self.instance.length)
        new_width = data.get("width", self.instance.width)
        new_unit = data.get("unit", self.instance.unit)

        if (new_length == self.instance.length
                and new_width == self.instance.width
                and new_unit == self.instance.unit):
            return data

        from plants.models import PlantPlacement  # local import to avoid circular dep

        new_width_ft = to_feet(new_width, new_unit)
        new_height_ft = to_feet(new_length, new_unit)

        out_of_bounds = (
            PlantPlacement.objects.filter(bed=self.instance)
            .annotate(
                x_end=ExpressionWrapper(F("x") + F("width"), output_field=FloatField()),
                y_end=ExpressionWrapper(F("y") + F("height"), output_field=FloatField()),
            )
            .filter(Q(x_end__gt=new_width_ft) | Q(y_end__gt=new_height_ft))
            .select_related("user_plant__plant")
        )

        if out_of_bounds.exists():
            names = list(out_of_bounds.values_list("user_plant__plant__common_name", flat=True))
            raise serializers.ValidationError(
                f"Resizing would push the following plants outside the grid: {', '.join(names)}."
                " Remove or reposition them first."
            )

        return data


class GardenSerializer(serializers.ModelSerializer):
    bed_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Garden
        fields = [
            "id",
            "name",
            "description",
            "length",
            "width",
            "unit",
            "orientation",
            "bed_count",
            "created_at",
            "updated_at",
            "owner",
        ]
        read_only_fields = ["id", "owner", "bed_count", "created_at", "updated_at"]

    def validate(self, data):
        if not self.instance:
            return data

        new_length = data.get("length", self.instance.length)
        new_width = data.get("width", self.instance.width)
        new_unit = data.get("unit", self.instance.unit)

        if (new_length == self.instance.length
                and new_width == self.instance.width
                and new_unit == self.instance.unit):
            return data

        if new_length is None or new_width is None:
            if self.instance.bed_placements.exists():
                raise serializers.ValidationError(
                    "Cannot remove garden dimensions while beds are placed on the layout."
                    " Remove all bed placements first."
                )
            return data

        new_width_ft = to_feet(new_width, new_unit)
        new_height_ft = to_feet(new_length, new_unit)

        out_of_bounds = [
            p for p in self.instance.bed_placements.select_related("bed")
            if p.x + to_feet(p.bed.width, p.bed.unit) > new_width_ft
            or p.y + to_feet(p.bed.length, p.bed.unit) > new_height_ft
        ]

        if out_of_bounds:
            names = [p.bed.name for p in out_of_bounds]
            raise serializers.ValidationError(
                f"Resizing would push the following beds outside the garden: {', '.join(names)}."
                " Remove or reposition them first."
            )

        return data

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        return super().create(validated_data)


class BedPlacementSerializer(serializers.ModelSerializer):
    bed_width_ft = serializers.SerializerMethodField()
    bed_height_ft = serializers.SerializerMethodField()

    def get_bed_width_ft(self, obj):
        return to_feet(obj.bed.width, obj.bed.unit)

    def get_bed_height_ft(self, obj):
        return to_feet(obj.bed.length, obj.bed.unit)

    class Meta:
        model = BedPlacement
        fields = [
            "id", "bed", "garden", "x", "y", "rotation",
            "bed_width_ft", "bed_height_ft", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "garden", "bed_width_ft", "bed_height_ft", "created_at", "updated_at"]

    def validate_bed(self, value):
        request = self.context.get("request")
        garden_id = self.context["view"].kwargs.get("garden_id")
        if not GardenBed.objects.filter(pk=value.pk, garden__id=garden_id, garden__owner=request.user).exists():
            raise serializers.ValidationError("Bed not found.")
        return value

    def validate(self, data):
        garden_id = self.context["view"].kwargs.get("garden_id")
        try:
            garden = Garden.objects.get(pk=garden_id, owner=self.context["request"].user)
        except Garden.DoesNotExist:
            raise serializers.ValidationError("Garden not found.") from None

        if garden.width is None or garden.length is None:
            raise serializers.ValidationError("Garden dimensions must be set before placing beds.")

        garden_width_ft = to_feet(garden.width, garden.unit)
        garden_height_ft = to_feet(garden.length, garden.unit)

        bed = data.get("bed") or (self.instance.bed if self.instance else None)
        bed_width_ft = to_feet(bed.width, bed.unit)
        bed_height_ft = to_feet(bed.length, bed.unit)

        x = data.get("x", self.instance.x if self.instance else None)
        y = data.get("y", self.instance.y if self.instance else None)

        if bed_width_ft > garden_width_ft or bed_height_ft > garden_height_ft:
            raise serializers.ValidationError("Bed does not fit in this garden.")

        if x is not None:
            data["x"] = max(0.0, min(x, garden_width_ft - bed_width_ft))
        if y is not None:
            data["y"] = max(0.0, min(y, garden_height_ft - bed_height_ft))

        return data


class GardenFeaturePlacementSerializer(serializers.ModelSerializer):
    shape = serializers.SerializerMethodField()

    def get_shape(self, obj):
        return GardenFeaturePlacement.OBJECT_SHAPE.get(obj.object_type, GardenFeaturePlacement.Shape.RECT)

    class Meta:
        model = GardenFeaturePlacement
        fields = [
            "id", "object_type", "shape", "label",
            "x", "y", "width", "height", "rotation",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "shape", "created_at", "updated_at"]

    def validate(self, data):
        object_type = data.get("object_type", getattr(self.instance, "object_type", None))
        custom_types = {
            GardenFeaturePlacement.ObjectType.CUSTOM_RECT,
            GardenFeaturePlacement.ObjectType.CUSTOM_CIRCLE,
        }
        label = data.get("label", getattr(self.instance, "label", ""))
        if object_type in custom_types and not label:
            raise serializers.ValidationError({"label": "A label is required for custom objects."})
        return data
