from django.db import models

from core.models import BaseModel
from gardens.models import GardenBed


class Plant(BaseModel):
    CATEGORY_CHOICES = [
        ("vegetable", "Vegetable"),
        ("herb", "Herb"),
        ("fruit", "Fruit"),
        ("flower", "Flower"),
        ("other", "Other"),
    ]

    common_name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["common_name"]

    def __str__(self):
        return self.common_name


class UserPlant(BaseModel):
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("planted", "Planted"),
        ("growing", "Growing"),
        ("harvested", "Harvested"),
        ("removed", "Removed"),
    ]

    bed = models.ForeignKey(GardenBed, related_name="user_plants", on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, related_name="user_plants", on_delete=models.PROTECT)
    variety = models.CharField(max_length=100, blank=True)
    planted_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    notes = models.TextField(blank=True)

    def __str__(self):
        label = f"{self.plant.common_name}"
        if self.variety:
            label += f" ({self.variety})"
        return label
