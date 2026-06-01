from django.db import migrations


def add_blackberry(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.create(
        common_name="Blackberry",
        scientific_name="Rubus fruticosus",
        category="fruit",
        description="A thorny cane fruit that produces in summer. Spreads aggressively via suckers and tip-rooting — plant with containment or in a dedicated bed.",
    )


def remove_blackberry(apps, schema_editor):
    Plant = apps.get_model("plants", "Plant")
    Plant.objects.filter(common_name="Blackberry").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("plants", "0008_plant_default_spacing_ft_alter_plantplacement_height_and_more"),
    ]

    operations = [
        migrations.RunPython(add_blackberry, reverse_code=remove_blackberry),
    ]
