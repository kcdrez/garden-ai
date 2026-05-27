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

    owner = models.ForeignKey(User, related_name="gardens", on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class GardenBed(BaseModel):
    FACING_CHOICES = [
        ("N", "North"),
        ("NE", "Northeast"),
        ("E", "East"),
        ("SE", "Southeast"),
        ("S", "South"),
        ("SW", "Southwest"),
        ("W", "West"),
        ("NW", "Northwest"),
    ]

    garden = models.ForeignKey(Garden, related_name="beds", on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    length = models.PositiveIntegerField()
    width = models.PositiveIntegerField()
    depth = models.PositiveIntegerField(null=True, blank=True)
    unit = models.CharField(max_length=2, choices=UNIT_CHOICES, default="ft")
    facing = models.CharField(max_length=2, choices=FACING_CHOICES, null=True, blank=True)
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

    def __str__(self):
        return f"{self.bed} @ ({self.x}, {self.y})"
