from django.db import migrations

PLANTS = [
    # Vegetables
    ("Tomato", "Solanum lycopersicum", "vegetable", "A warm-season crop producing edible fruits. One of the most popular garden vegetables."),
    ("Cucumber", "Cucumis sativus", "vegetable", "A fast-growing vine crop. Best harvested young for crisp texture."),
    ("Zucchini", "Cucurbita pepo", "vegetable", "A prolific summer squash. One plant can produce abundantly through the season."),
    ("Squash", "Cucurbita spp.", "vegetable", "Warm-season crop with many varieties. Use the variety field for Butternut, Acorn, Spaghetti, Delicata, etc."),
    ("Pumpkin", "Cucurbita pepo", "vegetable", "A warm-season vine crop. Use variety to distinguish carving types from culinary ones like Sugar Pie."),
    ("Bell Pepper", "Capsicum annuum", "vegetable", "Sweet peppers that ripen from green to red, yellow, or orange."),
    ("Jalapeño", "Capsicum annuum", "vegetable", "A medium-heat chili pepper, popular for salsas and pickling."),
    ("Lettuce", "Lactuca sativa", "vegetable", "A cool-season leafy green. Cut-and-come-again varieties extend the harvest window."),
    ("Spinach", "Spinacia oleracea", "vegetable", "A fast-growing cool-season green, high in iron and vitamins."),
    ("Kale", "Brassica oleracea", "vegetable", "A hardy leafy green that tolerates frost and can be harvested repeatedly."),
    ("Carrot", "Daucus carota", "vegetable", "A root vegetable that prefers loose, deep soil for straight growth."),
    ("Radish", "Raphanus sativus", "vegetable", "One of the fastest maturing vegetables, ready in as little as 3 weeks."),
    ("Rutabaga", "Brassica napus var. napobrassica", "vegetable", "A cool-season root vegetable, sweeter after frost. Often confused with turnip but larger and more nutritious."),
    ("Green Bean", "Phaseolus vulgaris", "vegetable", "Bush or pole varieties. Easy to grow and prolific producers."),
    ("Pea", "Pisum sativum", "vegetable", "A cool-season crop, best planted in early spring or fall."),
    ("Broccoli", "Brassica oleracea var. italica", "vegetable", "A cool-season crop. Harvest the central head before it flowers."),
    ("Cauliflower", "Brassica oleracea var. botrytis", "vegetable", "Similar to broccoli but more temperature-sensitive. Blanch heads for white color."),
    ("Garlic", "Allium sativum", "vegetable", "Planted in fall, harvested in summer. One of the easiest crops to store."),
    ("Onion", "Allium cepa", "vegetable", "Grown from sets or seeds. Stores well when cured properly after harvest."),
    ("Sweet Corn", "Zea mays", "vegetable", "Needs a large planting block for good pollination. Plant in groups, not rows."),
    ("Potato", "Solanum tuberosum", "vegetable", "Grown from seed potatoes. Hill soil as plants grow to increase yield."),
    # Herbs
    ("Basil", "Ocimum basilicum", "herb", "A warm-season herb. Pinch flowers to extend leaf production."),
    ("Parsley", "Petroselinum crispum", "herb", "A biennial herb commonly grown as an annual. Flat-leaf varieties have more flavor."),
    ("Cilantro", "Coriandrum sativum", "herb", "Bolts quickly in heat. Succession plant every 2-3 weeks for continuous harvest."),
    ("Chives", "Allium schoenoprasum", "herb", "A perennial herb with mild onion flavor. Edible flowers as well as leaves."),
    ("Dill", "Anethum graveolens", "herb", "Grows tall and feathery. Both leaves and seeds are used in cooking."),
    ("Mint", "Mentha spp.", "herb", "Vigorous and spreading - best grown in containers to prevent it taking over."),
    ("Rosemary", "Salvia rosmarinus", "herb", "A woody perennial herb. Drought-tolerant once established."),
    ("Thyme", "Thymus vulgaris", "herb", "A low-growing perennial herb. Excellent as a ground cover between other plants."),
    ("Oregano", "Origanum vulgare", "herb", "A hardy perennial herb with a strong flavor. Harvest before flowering for best taste."),
    ("Sage", "Salvia officinalis", "herb", "A woody perennial with silvery leaves. Harvest lightly in the first year."),
    # Fruits
    ("Strawberry", "Fragaria x ananassa", "fruit", "Perennial plants that spread via runners. June-bearing or everbearing varieties available."),
    ("Raspberry", "Rubus idaeus", "fruit", "A cane fruit that produces in summer or fall depending on variety. Spreads via suckers - contain with barriers."),
    ("Blueberry", "Vaccinium corymbosum", "fruit", "A perennial shrub that requires acidic soil. Needs multiple varieties nearby for good pollination and yield."),
    ("Watermelon", "Citrullus lanatus", "fruit", "Needs warm soil, full sun, and plenty of space. A long-season crop."),
    ("Cantaloupe", "Cucumis melo", "fruit", "A warm-season melon. Ready when the stem slips easily from the fruit."),
    # Flowers
    ("Sunflower", "Helianthus annuus", "flower", "Tall, cheerful annuals that attract pollinators and produce edible seeds."),
    ("Marigold", "Tagetes spp.", "flower", "Common companion plant believed to deter pests. Easy to grow from seed."),
    ("Nasturtium", "Tropaeolum majus", "flower", "Fully edible - flowers, leaves, and seeds. Great companion for vegetables."),
    ("Zinnia", "Zinnia elegans", "flower", "Prolific bloomers that attract pollinators. Cut-and-come-again through summer."),
    ("Lavender", "Lavandula angustifolia", "flower", "A fragrant perennial that attracts bees and repels some pests."),
]


def seed_plants(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.bulk_create([
        Plant(common_name=name, scientific_name=sci, category=cat, description=desc)
        for name, sci, cat, desc in PLANTS
    ])


def unseed_plants(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.filter(common_name__in=[p[0] for p in PLANTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("plants", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_plants, reverse_code=unseed_plants),
    ]
