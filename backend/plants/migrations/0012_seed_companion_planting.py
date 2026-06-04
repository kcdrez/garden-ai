from django.db import migrations


COMPANION_DATA = [
    # (plant_a_name, plant_b_name, relationship, notes)
    # --- Beneficial ---
    ("Tomato", "Basil", "beneficial", "Basil repels aphids and hornworms; said to improve tomato flavor."),
    ("Tomato", "Marigold", "beneficial", "Marigolds repel nematodes, aphids, and whiteflies."),
    ("Tomato", "Parsley", "beneficial", "Parsley attracts predatory insects that prey on tomato pests."),
    ("Tomato", "Nasturtium", "beneficial", "Nasturtiums act as a trap crop for aphids and repel whiteflies."),
    ("Tomato", "Garlic", "beneficial", "Garlic repels spider mites and aphids."),
    ("Tomato", "Chives", "beneficial", "Chives repel aphids and are said to improve tomato flavor."),
    ("Tomato", "Oregano", "beneficial", "Oregano deters pests and attracts beneficial insects."),
    ("Tomato", "Thyme", "beneficial", "Thyme deters tomato hornworm."),
    ("Tomato", "Asparagus", "beneficial", "Classic long-term companions; tomatoes repel asparagus beetle."),
    ("Basil", "Bell Pepper", "beneficial", "Basil repels aphids and spider mites from peppers."),
    ("Basil", "Jalapeño", "beneficial", "Basil repels aphids and spider mites from peppers."),
    ("Carrot", "Onion", "beneficial", "Onions repel carrot fly; carrots repel onion fly."),
    ("Carrot", "Leek", "beneficial", "Leeks repel carrot fly; carrots repel leek moth."),
    ("Carrot", "Chives", "beneficial", "Chives repel carrot fly and aphids."),
    ("Carrot", "Rosemary", "beneficial", "Rosemary repels carrot fly."),
    ("Carrot", "Sage", "beneficial", "Sage repels carrot fly."),
    ("Carrot", "Parsley", "beneficial", "Parsley attracts beneficial insects that prey on carrot pests."),
    ("Carrot", "Pea", "beneficial", "Peas fix nitrogen; carrots and peas grow at different depths."),
    ("Cucumber", "Nasturtium", "beneficial", "Nasturtiums repel aphids and cucumber beetles."),
    ("Cucumber", "Marigold", "beneficial", "Marigolds repel cucumber beetles and nematodes."),
    ("Cucumber", "Radish", "beneficial", "Radishes repel cucumber beetles."),
    ("Cucumber", "Pea", "beneficial", "Peas fix nitrogen; both are vining crops that use vertical space."),
    ("Pea", "Spinach", "beneficial", "Peas fix nitrogen that feeds spinach; spinach provides ground cover."),
    ("Pea", "Lettuce", "beneficial", "Space-efficient companions; peas provide nitrogen."),
    ("Cabbage", "Mint", "beneficial", "Mint repels cabbage moths and aphids."),
    ("Cabbage", "Rosemary", "beneficial", "Rosemary repels cabbage flies and moths."),
    ("Cabbage", "Sage", "beneficial", "Sage repels cabbage worms and white butterflies."),
    ("Cabbage", "Thyme", "beneficial", "Thyme repels cabbage worms."),
    ("Cabbage", "Marigold", "beneficial", "Marigolds repel cabbage pests including whiteflies."),
    ("Cabbage", "Nasturtium", "beneficial", "Nasturtiums act as a trap crop for aphids attacking cabbage."),
    ("Broccoli", "Rosemary", "beneficial", "Rosemary repels cabbage flies and moths."),
    ("Lettuce", "Radish", "beneficial", "Radishes break up soil for lettuce and serve as a row marker."),
    ("Lettuce", "Chives", "beneficial", "Chives deter aphids from lettuce."),
    ("Onion", "Beet", "beneficial", "Onions repel pests that attack beets."),
    ("Onion", "Lettuce", "beneficial", "Onions repel aphids; lettuce and onions use space efficiently."),
    ("Garlic", "Tomato", "beneficial", "Garlic repels spider mites and aphids from tomatoes."),
    ("Marigold", "Potato", "beneficial", "Marigolds repel Colorado potato beetle."),
    ("Marigold", "Bell Pepper", "beneficial", "Marigolds repel aphids and nematodes from peppers."),
    ("Marigold", "Jalapeño", "beneficial", "Marigolds repel aphids and nematodes from peppers."),
    ("Nasturtium", "Squash", "beneficial", "Nasturtiums repel squash bugs and aphids."),
    ("Nasturtium", "Zucchini", "beneficial", "Nasturtiums repel squash bugs and aphids."),
    ("Sweet Corn", "Squash", "beneficial", "Three Sisters: squash shades soil to retain moisture."),
    ("Sweet Corn", "Pumpkin", "beneficial", "Three Sisters variation: pumpkin shades soil."),
    ("Sweet Corn", "Green Bean", "beneficial", "Three Sisters: beans fix nitrogen for corn; corn provides a pole."),
    ("Squash", "Green Bean", "beneficial", "Three Sisters: beans fix nitrogen; squash shades soil."),
    ("Potato", "Green Bean", "beneficial", "Green beans and potatoes are mutually beneficial companions."),
    ("Strawberry", "Thyme", "beneficial", "Thyme deters insects and is said to improve strawberry flavor."),
    ("Strawberry", "Chives", "beneficial", "Chives prevent fungal diseases on strawberries."),
    ("Asparagus", "Parsley", "beneficial", "Parsley repels asparagus beetles."),
    # --- Harmful ---
    ("Tomato", "Fennel", "harmful", "Fennel exudes chemicals that inhibit tomato growth."),
    ("Tomato", "Cabbage", "harmful", "Cabbage and tomatoes compete and may suppress each other."),
    ("Tomato", "Potato", "harmful", "Same family (Solanaceae); share blight and other diseases."),
    ("Tomato", "Broccoli", "harmful", "Brassicas and tomatoes compete and may suppress each other."),
    ("Fennel", "Basil", "harmful", "Fennel inhibits basil growth."),
    ("Fennel", "Carrot", "harmful", "Fennel and carrot cross-pollinate and inhibit each other."),
    ("Fennel", "Cucumber", "harmful", "Fennel exudes chemicals that inhibit cucumber growth."),
    ("Fennel", "Pea", "harmful", "Fennel inhibits peas."),
    ("Fennel", "Eggplant", "harmful", "Fennel inhibits eggplant growth."),
    ("Fennel", "Cabbage", "harmful", "Fennel inhibits most brassicas."),
    ("Fennel", "Lettuce", "harmful", "Fennel inhibits lettuce growth."),
    ("Fennel", "Bell Pepper", "harmful", "Fennel inhibits pepper growth."),
    ("Fennel", "Spinach", "harmful", "Fennel inhibits spinach growth."),
    ("Onion", "Pea", "harmful", "Alliums inhibit the growth of peas and beans."),
    ("Onion", "Green Bean", "harmful", "Alliums inhibit the growth of beans."),
    ("Garlic", "Pea", "harmful", "Alliums inhibit the growth of peas."),
    ("Garlic", "Green Bean", "harmful", "Alliums inhibit the growth of beans."),
    ("Carrot", "Dill", "harmful", "Mature dill inhibits carrot germination and growth."),
    ("Potato", "Cucumber", "harmful", "Both are susceptible to similar soil-borne diseases."),
    ("Potato", "Squash", "harmful", "Squash and potato compete for space and nutrients."),
    ("Potato", "Sunflower", "harmful", "Sunflowers are allelopathic and inhibit potato growth."),
    ("Cabbage", "Strawberry", "harmful", "Brassicas inhibit strawberry growth."),
    ("Broccoli", "Strawberry", "harmful", "Brassicas inhibit strawberry growth."),
    ("Sunflower", "Green Bean", "harmful", "Sunflowers produce allelopathic chemicals that inhibit beans."),
    ("Beet", "Green Bean", "harmful", "Beans inhibit beet growth; not good companions."),
    ("Cucumber", "Sage", "harmful", "Sage inhibits cucumber growth."),
    ("Dill", "Tomato", "harmful", "Mature dill inhibits tomato growth (young dill is fine but risky)."),
]


def seed_companion_planting(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    CompanionPlanting = apps.get_model("plants", "CompanionPlanting")

    plant_map = {p.common_name: p for p in Plant.objects.all()}
    missing = set()
    created = 0

    for name_a, name_b, relationship, notes in COMPANION_DATA:
        plant_a_obj = plant_map.get(name_a)
        plant_b_obj = plant_map.get(name_b)
        if not plant_a_obj:
            missing.add(name_a)
            continue
        if not plant_b_obj:
            missing.add(name_b)
            continue

        # Enforce plant_a_id < plant_b_id to satisfy the check constraint
        id_a, id_b = str(plant_a_obj.id), str(plant_b_obj.id)
        if id_a > id_b:
            plant_a_obj, plant_b_obj = plant_b_obj, plant_a_obj

        CompanionPlanting.objects.get_or_create(
            plant_a=plant_a_obj,
            plant_b=plant_b_obj,
            defaults={"relationship": relationship, "notes": notes},
        )
        created += 1

    if missing:
        print(f"\n  WARNING: skipped companion pairs for unknown plants: {missing}")
    print(f"\n  Seeded {created} companion planting pairs.")


def unseed_companion_planting(apps, schema_editor):
    CompanionPlanting = apps.get_model("plants", "CompanionPlanting")
    CompanionPlanting.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("plants", "0011_add_companion_planting"),
    ]

    operations = [
        migrations.RunPython(seed_companion_planting, reverse_code=unseed_companion_planting),
    ]
