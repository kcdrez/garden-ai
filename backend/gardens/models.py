from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.db import models

from core.models import BaseModel

UNIT_CHOICES = [
    ("in", "Inches"),
    ("ft", "Feet"),
    ("cm", "Centimeters"),
    ("m", "Meters"),
]


class Garden(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    length = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default="ft")
    orientation = models.SmallIntegerField(default=0)

    owner = models.ForeignKey(User, related_name="gardens", on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class GardenBed(BaseModel):
    garden = models.ForeignKey(Garden, related_name="beds", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    length = models.FloatField()
    width = models.FloatField()
    depth = models.FloatField(null=True, blank=True)
    unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default="ft")
    orientation = models.SmallIntegerField(default=0)
    avg_sunlight_hours = models.PositiveSmallIntegerField(null=True, blank=True)
    soil_type = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.garden.name})"


class BedPlacement(BaseModel):
    bed = models.OneToOneField(GardenBed, related_name="placement", on_delete=models.CASCADE)
    garden = models.ForeignKey(Garden, related_name="bed_placements", on_delete=models.CASCADE)
    x = models.FloatField(validators=[MinValueValidator(0)])
    y = models.FloatField(validators=[MinValueValidator(0)])
    rotation = models.SmallIntegerField(default=0)

    def __str__(self):
        return f"{self.bed} @ ({self.x}, {self.y})"


class GardenFeaturePlacement(BaseModel):
    class ObjectType(models.TextChoices):
        SHED = "shed", "Shed"
        BENCH = "bench", "Bench"
        ARBOR = "arbor", "Arbor / Arch"
        TRELLIS = "trellis", "Trellis"
        FENCE = "fence", "Fence Section"
        COMPOST = "compost", "Compost Bin"
        RAIN_BARREL = "rain_barrel", "Rain Barrel"
        COLD_FRAME = "cold_frame", "Cold Frame"
        FOUNTAIN = "fountain", "Fountain"
        BIRD_BATH = "bird_bath", "Bird Bath"
        POT = "pot", "Pot / Container"
        TOMATO_CAGE = "tomato_cage", "Tomato Cage"
        ROW_COVER = "row_cover", "Row Cover / Cloche"
        CUSTOM_RECT = "custom_rect", "Custom Area (Rectangle)"
        CUSTOM_CIRCLE = "custom_circle", "Custom Area (Circle)"

    class Shape(models.TextChoices):
        RECT = "rect", "Rectangle"
        CIRCLE = "circle", "Circle"

    OBJECT_SHAPE = {
        ObjectType.SHED: Shape.RECT,
        ObjectType.BENCH: Shape.RECT,
        ObjectType.ARBOR: Shape.RECT,
        ObjectType.TRELLIS: Shape.RECT,
        ObjectType.FENCE: Shape.RECT,
        ObjectType.COMPOST: Shape.RECT,
        ObjectType.RAIN_BARREL: Shape.RECT,
        ObjectType.COLD_FRAME: Shape.RECT,
        ObjectType.FOUNTAIN: Shape.CIRCLE,
        ObjectType.BIRD_BATH: Shape.CIRCLE,
        ObjectType.POT: Shape.CIRCLE,
        ObjectType.TOMATO_CAGE: Shape.CIRCLE,
        ObjectType.ROW_COVER: Shape.CIRCLE,
        ObjectType.CUSTOM_RECT: Shape.RECT,
        ObjectType.CUSTOM_CIRCLE: Shape.CIRCLE,
    }

    user = models.ForeignKey("auth.User", related_name="garden_feature_placements", on_delete=models.CASCADE)
    garden = models.ForeignKey(
        Garden, related_name="feature_placements", null=True, blank=True, on_delete=models.CASCADE
    )
    bed = models.ForeignKey(
        GardenBed, related_name="feature_placements", null=True, blank=True, on_delete=models.CASCADE
    )
    object_type = models.CharField(max_length=20, choices=ObjectType.choices)
    label = models.CharField(max_length=100, blank=True)
    x = models.FloatField(validators=[MinValueValidator(0)])
    y = models.FloatField(validators=[MinValueValidator(0)])
    width = models.FloatField(default=1.0, validators=[MinValueValidator(0.01)])
    height = models.FloatField(default=1.0, validators=[MinValueValidator(0.01)])
    rotation = models.SmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(garden__isnull=False, bed__isnull=True)
                    | models.Q(garden__isnull=True, bed__isnull=False)
                ),
                name="garden_feature_placement_exactly_one_scope",
            )
        ]

    def __str__(self):
        target = self.garden or self.bed
        return f"{self.get_object_type_display()} @ ({self.x}, {self.y}) in {target}"
