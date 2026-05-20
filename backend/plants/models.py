from django.core.validators import MinValueValidator
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
        ("fruiting", "Fruiting"),
        ("dormant", "Dormant"),
        ("removed", "Removed"),
    ]

    bed = models.ForeignKey(GardenBed, related_name="user_plants", on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, related_name="user_plants", on_delete=models.PROTECT)
    variety = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")
    notes = models.TextField(blank=True)

    def __str__(self):
        label = f"{self.plant.common_name}"
        if self.variety:
            label += f" ({self.variety})"
        return label


class Observation(BaseModel):
    TYPE_CHOICES = [
        ("status_change", "Status Change"),
        ("harvest", "Harvest"),
        ("pest", "Pest"),
        ("weather", "Weather"),
        ("disease", "Disease"),
        ("general", "General"),
    ]

    user_plant = models.ForeignKey(UserPlant, related_name="observations", on_delete=models.CASCADE)
    observed_date = models.DateField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    note = models.TextField(blank=True)
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["observed_date", "created_at"]

    def __str__(self):
        return f"{self.user_plant} — {self.type} on {self.observed_date}"


class PlantPlacement(BaseModel):
    user_plant = models.OneToOneField(UserPlant, related_name="placement", on_delete=models.CASCADE)
    bed = models.ForeignKey(GardenBed, related_name="placements", on_delete=models.CASCADE)
    x = models.IntegerField(validators=[MinValueValidator(0)])
    y = models.IntegerField(validators=[MinValueValidator(0)])
    width = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    height = models.IntegerField(default=1, validators=[MinValueValidator(1)])

    def __str__(self):
        return f"{self.user_plant} @ ({self.x}, {self.y})"
