from django.db import migrations, models


def populate_placement_dimensions(apps, schema_editor):
    BedPlacement = apps.get_model("gardens", "BedPlacement")

    def to_feet(value, unit):
        if unit == "ft":
            return float(value)
        if unit == "in":
            return float(value) / 12
        if unit == "cm":
            return float(value) / 30.48
        if unit == "m":
            return float(value) * 3.28084
        return float(value)

    for placement in BedPlacement.objects.select_related("bed"):
        bed = placement.bed
        placement.width_ft = to_feet(bed.width, bed.unit)
        placement.height_ft = to_feet(bed.length, bed.unit)
        placement.save(update_fields=["width_ft", "height_ft"])


class Migration(migrations.Migration):

    dependencies = [
        ("gardens", "0004_remove_bedplacement_height_remove_bedplacement_width_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="bedplacement",
            name="width_ft",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bedplacement",
            name="height_ft",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.RunPython(populate_placement_dimensions, migrations.RunPython.noop),
    ]
