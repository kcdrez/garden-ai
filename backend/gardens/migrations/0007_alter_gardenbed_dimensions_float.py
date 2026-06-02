from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gardens", "0006_remove_bedplacement_width_ft_height_ft"),
    ]

    operations = [
        migrations.AlterField(
            model_name="gardenbed",
            name="length",
            field=models.FloatField(),
        ),
        migrations.AlterField(
            model_name="gardenbed",
            name="width",
            field=models.FloatField(),
        ),
        migrations.AlterField(
            model_name="gardenbed",
            name="depth",
            field=models.FloatField(null=True, blank=True),
        ),
    ]
