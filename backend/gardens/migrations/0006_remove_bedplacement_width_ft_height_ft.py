from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("gardens", "0005_bedplacement_width_ft_bedplacement_height_ft"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="bedplacement",
            name="width_ft",
        ),
        migrations.RemoveField(
            model_name="bedplacement",
            name="height_ft",
        ),
    ]
