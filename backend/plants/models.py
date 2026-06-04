from django.core.validators import MinValueValidator
from django.db import models

from core.models import BaseModel
from gardens.models import GardenBed


class Plant(BaseModel):
    class Category(models.TextChoices):
        VEGETABLE = "vegetable", "Vegetable"
        HERB = "herb", "Herb"
        FRUIT = "fruit", "Fruit"
        FLOWER = "flower", "Flower"
        OTHER = "other", "Other"

    common_name = models.CharField(max_length=100)
    scientific_name = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    default_spacing_ft = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["common_name"]

    def __str__(self):
        return self.common_name


class UserPlant(BaseModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        PLANTED = "planted", "Planted"
        GROWING = "growing", "Growing"
        FRUITING = "fruiting", "Fruiting"
        DORMANT = "dormant", "Dormant"
        REMOVED = "removed", "Removed"

    bed = models.ForeignKey(GardenBed, related_name="user_plants", on_delete=models.CASCADE)
    plant = models.ForeignKey(Plant, related_name="user_plants", on_delete=models.PROTECT)
    variety = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    notes = models.TextField(blank=True)

    def __str__(self):
        label = f"{self.plant.common_name}"
        if self.variety:
            label += f" ({self.variety})"
        return label


class Observation(BaseModel):
    class Type(models.TextChoices):
        STATUS_CHANGE = "status_change", "Status Change"
        TRANSPLANT = "transplant", "Transplant"
        HARVEST = "harvest", "Harvest"
        PEST = "pest", "Pest"
        WEATHER = "weather", "Weather"
        DISEASE = "disease", "Disease"
        GENERAL = "general", "General"

    user_plant = models.ForeignKey(UserPlant, related_name="observations", on_delete=models.CASCADE)
    observed_date = models.DateField()
    type = models.CharField(max_length=20, choices=Type.choices)
    note = models.TextField(blank=True)
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["observed_date", "created_at"]

    def __str__(self):
        return f"{self.user_plant} — {self.type} on {self.observed_date}"


class CompanionPlanting(BaseModel):
    class Relationship(models.TextChoices):
        BENEFICIAL = "beneficial", "Beneficial"
        HARMFUL = "harmful", "Harmful"

    plant_a = models.ForeignKey(Plant, related_name="companion_a_set", on_delete=models.CASCADE)
    plant_b = models.ForeignKey(Plant, related_name="companion_b_set", on_delete=models.CASCADE)
    relationship = models.CharField(max_length=20, choices=Relationship.choices)
    notes = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["plant_a", "plant_b"], name="unique_companion_pair"),
            models.CheckConstraint(condition=models.Q(plant_a__lt=models.F("plant_b")), name="companion_plant_a_lt_plant_b"),
        ]

    def __str__(self):
        return f"{self.plant_a} is {self.relationship} to {self.plant_b}"


class PlantPlacement(BaseModel):
    user_plant = models.OneToOneField(UserPlant, related_name="placement", on_delete=models.CASCADE)
    bed = models.ForeignKey(GardenBed, related_name="placements", on_delete=models.CASCADE)
    x = models.FloatField(validators=[MinValueValidator(0)])
    y = models.FloatField(validators=[MinValueValidator(0)])
    width = models.FloatField(default=1.0, validators=[MinValueValidator(0.01)])
    height = models.FloatField(default=1.0, validators=[MinValueValidator(0.01)])

    def __str__(self):
        return f"{self.user_plant} @ ({self.x}, {self.y})"
