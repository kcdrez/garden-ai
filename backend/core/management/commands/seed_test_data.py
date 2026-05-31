from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from gardens.models import Garden, GardenBed
from plants.models import Plant, PlantPlacement, UserPlant


class Command(BaseCommand):
    help = "Seed deterministic test data for e2e tests"

    def handle(self, *args, **options):
        User.objects.all().delete()

        user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="TestPass123!",
        )

        garden = Garden.objects.create(
            owner=user,
            name="Sunrise Garden",
            length=12,
            width=10,
            unit="ft",
        )

        bed = GardenBed.objects.create(
            garden=garden,
            name="Front Raised Bed",
            length=8,
            width=4,
            unit="ft",
        )

        tomato = Plant.objects.get(common_name="Tomato")

        plant = UserPlant.objects.create(
            bed=bed,
            plant=tomato,
            status=UserPlant.Status.PLANNED,
        )

        PlantPlacement.objects.create(
            user_plant=plant,
            bed=bed,
            x=1,
            y=1,
            width=1,
            height=1,
        )

        self.stdout.write(self.style.SUCCESS("Test data seeded successfully"))
