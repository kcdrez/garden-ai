from django.db.models import ExpressionWrapper, F, IntegerField, Q
from rest_framework import serializers

from core.utils import grid_dimensions

from .models import BedPlacement, Garden, GardenBed


def garden_grid_dimensions(garden):
    return grid_dimensions(garden.length, garden.width, garden.unit)


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

        new_cols, new_rows = grid_dimensions(new_length, new_width, new_unit)

        out_of_bounds = (
            PlantPlacement.objects.filter(bed=self.instance)
            .annotate(
                x_end=ExpressionWrapper(F("x") + F("width"), output_field=IntegerField()),
                y_end=ExpressionWrapper(F("y") + F("height"), output_field=IntegerField()),
            )
            .filter(Q(x_end__gt=new_cols) | Q(y_end__gt=new_rows))
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

        new_cols, new_rows = grid_dimensions(new_length, new_width, new_unit)

        out_of_bounds = (
            self.instance.bed_placements
            .annotate(
                x_end=ExpressionWrapper(F("x") + F("width"), output_field=IntegerField()),
                y_end=ExpressionWrapper(F("y") + F("height"), output_field=IntegerField()),
            )
            .filter(Q(x_end__gt=new_cols) | Q(y_end__gt=new_rows))
            .select_related("bed")
        )

        if out_of_bounds.exists():
            names = list(out_of_bounds.values_list("bed__name", flat=True))
            raise serializers.ValidationError(
                f"Resizing would push the following beds outside the grid: {', '.join(names)}."
                " Remove or reposition them first."
            )

        return data

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        return super().create(validated_data)


class BedPlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BedPlacement
        fields = ["id", "bed", "garden", "x", "y", "width", "height", "created_at", "updated_at"]
        read_only_fields = ["id", "garden", "created_at", "updated_at"]

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

        cols, rows = garden_grid_dimensions(garden)
        x = data.get("x", self.instance.x if self.instance else None)
        y = data.get("y", self.instance.y if self.instance else None)
        width = data.get("width", self.instance.width if self.instance else 1)
        height = data.get("height", self.instance.height if self.instance else 1)

        if x is not None and (x < 0 or x + width > cols):
            raise serializers.ValidationError({"x": f"Out of bounds (grid is {cols} columns wide)."})
        if y is not None and (y < 0 or y + height > rows):
            raise serializers.ValidationError({"y": f"Out of bounds (grid is {rows} rows tall)."})

        return data
