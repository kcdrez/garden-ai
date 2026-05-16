import uuid

from django.contrib.auth.models import User
from django.db import models


class Garden(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(User, related_name="gardens", on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class GardenBed(models.Model):
    UNIT_CHOICES = [
        ("in", "Inches"),
        ("ft", "Feet"),
        ("cm", "Centimeters"),
        ("m", "Meters"),
    ]

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.garden.name})"
