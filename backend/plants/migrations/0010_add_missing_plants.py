from django.db import migrations

NEW_PLANTS = [
    # Vegetables
    ("Beet", "Beta vulgaris", "vegetable", "A dual-purpose root vegetable — both the roots and greens are edible. Tolerates light frost and grows well in cool seasons."),
    ("Swiss Chard", "Beta vulgaris subsp. vulgaris", "vegetable", "A colorful leafy green closely related to beet. Heat-tolerant and cut-and-come-again through the season."),
    ("Eggplant", "Solanum melongena", "vegetable", "A warm-season crop that needs heat to thrive. Use variety to distinguish Italian, Japanese, and globe types."),
    ("Sweet Potato", "Ipomoea batatas", "vegetable", "A warm-season vine crop grown from slips. Needs long summers and well-drained soil. Very different growing habit from regular potato."),
    ("Cabbage", "Brassica oleracea var. capitata", "vegetable", "A cool-season brassica. Important for crop rotation — avoid planting in the same bed as other brassicas year after year."),
    ("Asparagus", "Asparagus officinalis", "vegetable", "A perennial vegetable that occupies a bed for 15–20 years. Takes 2–3 years to establish before harvest. Plan placement carefully."),
    ("Arugula", "Eruca vesicaria", "vegetable", "A fast-growing peppery salad green. Bolts quickly in heat — best in spring and fall. Succession plant every 2 weeks."),
    ("Leek", "Allium ampeloprasum", "vegetable", "A mild allium with a long harvest window. Blanch the stems by hilling soil as they grow."),
    # Herbs
    ("Fennel", "Foeniculum vulgare", "herb", "An anise-flavored perennial herb. Note: fennel is allelopathic — it inhibits growth in many nearby plants (tomatoes, peppers, beans). Best grown in isolation."),
    ("Lemon Balm", "Melissa officinalis", "herb", "A vigorous lemon-scented perennial in the mint family. Attracts pollinators but spreads readily — consider containing it."),
    # Flowers
    ("Calendula", "Calendula officinalis", "flower", "A hardy annual with edible, medicinal flowers. Excellent companion plant — attracts beneficial insects and deters aphids."),
    ("Echinacea", "Echinacea purpurea", "flower", "A drought-tolerant perennial coneflower. Attracts pollinators and beneficial insects. Low-maintenance once established."),
]


def add_plants(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.bulk_create([
        Plant(common_name=name, scientific_name=sci, category=cat, description=desc)
        for name, sci, cat, desc in NEW_PLANTS
    ])


def remove_plants(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.filter(common_name__in=[p[0] for p in NEW_PLANTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("plants", "0009_add_blackberry"),
    ]

    operations = [
        migrations.RunPython(add_plants, reverse_code=remove_plants),
    ]
