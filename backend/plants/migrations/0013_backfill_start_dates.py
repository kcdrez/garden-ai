from django.db import migrations


def backfill_start_dates(apps, schema_editor):
    UserPlant = apps.get_model("plants", "UserPlant")
    updated = 0
    for plant in UserPlant.objects.prefetch_related("observations"):
        earliest = (
            plant.observations
            .filter(type="status_change")
            .order_by("observed_date")
            .values_list("observed_date", flat=True)
            .first()
        )
        if earliest != plant.start_date:
            plant.start_date = earliest
            plant.save(update_fields=["start_date"])
            updated += 1
    print(f"  Backfilled start_date for {updated} plant(s).")  # noqa: T201


class Migration(migrations.Migration):
    dependencies = [
        ("plants", "0012_seed_companion_planting"),
    ]

    operations = [
        migrations.RunPython(backfill_start_dates, migrations.RunPython.noop),
    ]
