import os
from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from gardens.models import BedPlacement, Garden, GardenBed, GardenFeaturePlacement
from plants.models import Observation, Plant, PlantPlacement, UserPlant

# Shorthand builders for observation dicts — keeps data lines under 120 chars.
OT = Observation.Type


def _sc(d, note="", prev="", new=""):
    return {"observed_date": d, "type": OT.STATUS_CHANGE, "note": note, "previous_status": prev, "new_status": new}


def _harvest(d, note=""):
    return {"observed_date": d, "type": OT.HARVEST, "note": note}


def _pest(d, note=""):
    return {"observed_date": d, "type": OT.PEST, "note": note}


def _disease(d, note=""):
    return {"observed_date": d, "type": OT.DISEASE, "note": note}


def _general(d, note=""):
    return {"observed_date": d, "type": OT.GENERAL, "note": note}


class Command(BaseCommand):
    help = "Seed a demo account with rich multi-season garden data. Pass --force to wipe and recreate."

    DEMO_USERNAME = "garden_demo"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete the existing demo user and all their data, then re-seed from scratch.",
        )

    def handle(self, *args, **options):
        existing = User.objects.filter(username=self.DEMO_USERNAME).first()
        if existing:
            if options["force"]:
                existing.delete()
                self.stdout.write(f"Deleted existing demo user '{self.DEMO_USERNAME}'. Re-seeding...")
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"Demo user '{self.DEMO_USERNAME}' already exists — skipping. "
                        "Pass --force to wipe and recreate."
                    )
                )
                return

        password = os.environ.get("DEMO_PASSWORD")
        if not password:
            raise CommandError(
                "DEMO_PASSWORD environment variable is required but not set."
            )

        user = User.objects.create_user(
            username=self.DEMO_USERNAME,
            email="demo@garden-ai.app",
            password=password,
        )

        self._seed_backyard_garden(user)
        self._seed_side_yard_garden(user)

        garden_count = Garden.objects.filter(owner=user).count()
        bed_count = GardenBed.objects.filter(garden__owner=user).count()
        plant_count = UserPlant.objects.filter(bed__garden__owner=user).count()
        obs_count = Observation.objects.filter(user_plant__bed__garden__owner=user).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data seeded for '{self.DEMO_USERNAME}': "
                f"{garden_count} gardens, {bed_count} beds, {plant_count} plants, {obs_count} observations."
            )
        )

    def _get_plant(self, name):
        try:
            return Plant.objects.get(common_name=name)
        except Plant.DoesNotExist as err:
            raise CommandError(f"Plant '{name}' not found in the catalog.") from err

    def _add_plant(
        self, bed, plant_name, variety="", start_date=None,
        status=UserPlant.Status.PLANNED, notes="", x=0, y=0,
        width=1, height=1, observations=None,
    ):
        plant = self._get_plant(plant_name)
        up = UserPlant.objects.create(
            bed=bed, plant=plant, variety=variety,
            start_date=start_date, status=status, notes=notes,
        )
        if status != UserPlant.Status.REMOVED:
            PlantPlacement.objects.create(user_plant=up, bed=bed, x=x, y=y, width=width, height=height)
        for obs in (observations or []):
            Observation.objects.create(user_plant=up, **obs)
        return up

    # ------------------------------------------------------------------
    # Garden 1 - Backyard Vegetable Garden
    # 20 ft wide x 16 ft tall, north-facing (orientation=0)
    # 4 beds, 3 seasons of history (2024-2026)
    # ------------------------------------------------------------------

    def _seed_backyard_garden(self, user):
        garden = Garden.objects.create(
            owner=user,
            name="Backyard Vegetable Garden",
            description=(
                "Our main growing space — raised beds for vegetables, "
                "a dedicated herb bed, and a flower border for pollinators."
            ),
            length=16, width=20, unit="ft", orientation=0,
        )

        bed_a = GardenBed.objects.create(
            garden=garden, name="Raised Bed A",
            length=4, width=8, unit="ft", avg_sunlight_hours=8,
            soil_type="Loam / compost mix",
            notes="Main vegetable bed. Tomatoes tied to trellis on the north end.",
        )
        bed_b = GardenBed.objects.create(
            garden=garden, name="Raised Bed B",
            length=4, width=8, unit="ft", avg_sunlight_hours=7,
            soil_type="Sandy loam",
            notes="Root vegetables and cool-season greens.",
        )
        herb_bed = GardenBed.objects.create(
            garden=garden, name="Herb Bed",
            length=3, width=6, unit="ft", avg_sunlight_hours=6,
            soil_type="Well-draining sandy mix",
            notes="Perennial herbs plus annuals. Mint is in a submerged pot to limit spreading.",
        )
        flower_border = GardenBed.objects.create(
            garden=garden, name="Flower Border",
            length=2, width=10, unit="ft", avg_sunlight_hours=7,
            soil_type="Mixed garden soil",
            notes="Pollinators and trap crops bordering the vegetable beds.",
        )

        BedPlacement.objects.create(bed=bed_a, garden=garden, x=1, y=1)
        BedPlacement.objects.create(bed=bed_b, garden=garden, x=1, y=6)
        BedPlacement.objects.create(bed=herb_bed, garden=garden, x=11, y=1)
        BedPlacement.objects.create(bed=flower_border, garden=garden, x=1, y=12)

        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="trellis", x=1, y=0, width=4, height=1,
        )
        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="compost", x=17, y=1, width=2, height=2,
        )
        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="rain_barrel", x=17, y=4, width=1, height=1,
        )
        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="bird_bath", x=12, y=7, width=1.5, height=1.5,
        )

        self._seed_bed_a_2024(bed_a)
        self._seed_bed_b_2024(bed_b)
        self._seed_bed_a_2025(bed_a)
        self._seed_bed_b_2025(bed_b)
        self._seed_bed_a_2026(bed_a)
        self._seed_bed_b_2026(bed_b)
        self._seed_herb_bed(herb_bed)
        self._seed_flower_border(flower_border)

    # --- Bed A 2024: tomatoes, peppers, basil, marigold ---

    def _seed_bed_a_2024(self, bed):
        self._add_plant(bed, "Tomato", variety="Cherokee Purple",
            start_date=date(2024, 3, 20), status=UserPlant.Status.REMOVED,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2024, 3, 20), note="Transplanted from starts.", prev="planned", new="planted"),
                _sc(date(2024, 5, 1), note="Growing strong, first flower clusters forming.", prev="planted", new="growing"),
                _pest(date(2024, 6, 15), note="Aphids on lower leaves. Sprayed neem oil."),
                _sc(date(2024, 7, 10), note="First fruits setting.", prev="growing", new="fruiting"),
                _harvest(date(2024, 8, 5), note="First harvest — beautiful deep purple, excellent flavor."),
                _sc(date(2024, 9, 20), note="Season winding down. Pulled before frost.", prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Tomato", variety="Sun Gold Cherry",
            start_date=date(2024, 3, 20), status=UserPlant.Status.REMOVED,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2024, 3, 20), prev="planned", new="planted"),
                _sc(date(2024, 5, 1), prev="planted", new="growing"),
                _sc(date(2024, 7, 1), prev="growing", new="fruiting"),
                _harvest(date(2024, 7, 20), note="Prolific! Picking daily. Sweetest tomatoes in the garden."),
                _sc(date(2024, 9, 20), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Tomato", variety="Roma",
            start_date=date(2024, 3, 20), status=UserPlant.Status.REMOVED,
            x=4, y=0, width=2, height=2,
            observations=[
                _sc(date(2024, 3, 20), prev="planned", new="planted"),
                _sc(date(2024, 5, 5), prev="planted", new="growing"),
                _sc(date(2024, 7, 5), prev="growing", new="fruiting"),
                _harvest(date(2024, 8, 15), note="Batch harvest for sauce — over 15 lbs total."),
                _sc(date(2024, 9, 20), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Bell Pepper", variety="California Wonder",
            start_date=date(2024, 4, 1), status=UserPlant.Status.REMOVED,
            x=6, y=0, width=1, height=2,
            observations=[
                _sc(date(2024, 4, 1), prev="planned", new="planted"),
                _sc(date(2024, 5, 15), prev="planted", new="growing"),
                _sc(date(2024, 7, 20), prev="growing", new="fruiting"),
                _harvest(date(2024, 8, 20), note="Good yield. Several turned fully red — sweeter that way."),
                _sc(date(2024, 9, 25), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Bell Pepper", variety="Yellow Wonder",
            start_date=date(2024, 4, 1), status=UserPlant.Status.REMOVED,
            x=7, y=0, width=1, height=2,
            observations=[
                _sc(date(2024, 4, 1), prev="planned", new="planted"),
                _sc(date(2024, 5, 15), prev="planted", new="growing"),
                _sc(date(2024, 7, 25), prev="growing", new="fruiting"),
                _harvest(date(2024, 8, 25), note="Beautiful yellow peppers, great for grilling."),
                _sc(date(2024, 9, 25), prev="fruiting", new="removed"),
            ]
        )
        for x in [0, 1]:
            self._add_plant(bed, "Basil", variety="Genovese",
                start_date=date(2024, 4, 10), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2024, 4, 10), prev="planned", new="planted"),
                    _sc(date(2024, 5, 5), prev="planted", new="growing"),
                    _general(date(2024, 6, 20), note="Pinched first flower buds — growing bushy."),
                    _sc(date(2024, 9, 1), note="Bolting with cooler temps. Final harvest for pesto.", prev="growing", new="removed"),
                ]
            )
        for x in [2, 3]:
            self._add_plant(bed, "Marigold",
                start_date=date(2024, 4, 5), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2024, 4, 5), prev="planned", new="planted"),
                    _sc(date(2024, 5, 1), prev="planted", new="growing"),
                    _sc(date(2024, 6, 1), note="First flowers open.", prev="growing", new="fruiting"),
                    _sc(date(2024, 10, 1), prev="fruiting", new="removed"),
                ]
            )

    # --- Bed B 2024: root veg + cool-season greens ---

    def _seed_bed_b_2024(self, bed):
        for x, variety in enumerate(["Nantes", "Danvers", "Purple Haze", "Chantenay"]):
            self._add_plant(bed, "Carrot", variety=variety,
                start_date=date(2024, 4, 1), status=UserPlant.Status.REMOVED,
                x=x, y=0, width=1, height=2,
                observations=[
                    _sc(date(2024, 4, 1), prev="planned", new="planted"),
                    _sc(date(2024, 5, 10), prev="planted", new="growing"),
                    _harvest(date(2024, 7, 15), note=f"Harvested {variety} carrots — good size and flavor."),
                    _sc(date(2024, 7, 15), prev="growing", new="removed"),
                ]
            )
        for x in [4, 5]:
            self._add_plant(bed, "Onion",
                start_date=date(2024, 3, 25), status=UserPlant.Status.REMOVED,
                x=x, y=0, width=1, height=1,
                observations=[
                    _sc(date(2024, 3, 25), prev="planned", new="planted"),
                    _sc(date(2024, 5, 1), prev="planted", new="growing"),
                    _harvest(date(2024, 7, 20), note="Pulled and curing in the shed."),
                    _sc(date(2024, 7, 20), prev="growing", new="removed"),
                ]
            )
        for x in [0, 1]:
            self._add_plant(bed, "Lettuce", variety="Butterhead",
                start_date=date(2024, 4, 5), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2024, 4, 5), prev="planned", new="planted"),
                    _sc(date(2024, 4, 25), prev="planted", new="growing"),
                    _harvest(date(2024, 6, 1), note="Cut-and-come-again — three harvests this spring."),
                    _sc(date(2024, 6, 25), note="Bolting in summer heat.", prev="growing", new="removed"),
                ]
            )
        for x in [2, 3]:
            self._add_plant(bed, "Spinach",
                start_date=date(2024, 4, 1), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2024, 4, 1), prev="planned", new="planted"),
                    _sc(date(2024, 4, 20), prev="planted", new="growing"),
                    _harvest(date(2024, 5, 25), note="Harvested several times before bolting."),
                    _sc(date(2024, 6, 15), note="Bolted in warm spell.", prev="growing", new="removed"),
                ]
            )
        for x in [4, 5]:
            self._add_plant(bed, "Radish", variety="French Breakfast",
                start_date=date(2024, 4, 1), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2024, 4, 1), prev="planned", new="planted"),
                    _harvest(date(2024, 4, 22), note="First radishes of the year — ready in 3 weeks!"),
                    _sc(date(2024, 4, 22), prev="planted", new="removed"),
                ]
            )

    # --- Bed A 2025: cucumbers + zucchini replace tomatoes (crop rotation) ---

    def _seed_bed_a_2025(self, bed):
        self._add_plant(bed, "Cucumber", variety="Marketmore",
            start_date=date(2025, 4, 15), status=UserPlant.Status.REMOVED,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 15), prev="planned", new="planted"),
                _sc(date(2025, 5, 20), prev="planted", new="growing"),
                _sc(date(2025, 6, 25), prev="growing", new="fruiting"),
                _harvest(date(2025, 7, 15), note="Great cucumber season. Picking every 2 days."),
                _disease(date(2025, 9, 10), note="Powdery mildew developing on leaves. Season ended early."),
                _sc(date(2025, 9, 12), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Cucumber", variety="Lemon",
            start_date=date(2025, 4, 15), status=UserPlant.Status.REMOVED,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 15), prev="planned", new="planted"),
                _sc(date(2025, 5, 20), prev="planted", new="growing"),
                _sc(date(2025, 6, 30), prev="growing", new="fruiting"),
                _harvest(date(2025, 7, 20), note="Round yellow cucumbers the size of a lemon. Great conversation starter!"),
                _sc(date(2025, 9, 12), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Zucchini", variety="Black Beauty",
            start_date=date(2025, 4, 20), status=UserPlant.Status.REMOVED,
            x=4, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 5, 25), prev="planted", new="growing"),
                _sc(date(2025, 6, 20), prev="growing", new="fruiting"),
                _harvest(date(2025, 7, 1), note="Left one too long — zucchini the size of a baseball bat. Harvesting every other day now."),
                _sc(date(2025, 9, 15), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Jalapeño",
            start_date=date(2025, 4, 10), status=UserPlant.Status.REMOVED,
            x=6, y=0, width=1, height=2,
            observations=[
                _sc(date(2025, 4, 10), prev="planned", new="planted"),
                _sc(date(2025, 5, 20), prev="planted", new="growing"),
                _sc(date(2025, 7, 10), prev="growing", new="fruiting"),
                _harvest(date(2025, 8, 5), note="Pickled a whole jar. Great heat level."),
                _sc(date(2025, 9, 20), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Nasturtium",
            start_date=date(2025, 4, 15), status=UserPlant.Status.REMOVED,
            x=0, y=2, width=1, height=1,
            observations=[
                _sc(date(2025, 4, 15), prev="planned", new="planted"),
                _sc(date(2025, 5, 10), prev="planted", new="growing"),
                _sc(date(2025, 6, 5), note="Flowering all season. Visibly attracting aphids away from cucumbers.", prev="growing", new="fruiting"),
                _sc(date(2025, 10, 1), prev="fruiting", new="removed"),
            ]
        )
        for x in [1, 2]:
            self._add_plant(bed, "Marigold",
                start_date=date(2025, 4, 15), status=UserPlant.Status.REMOVED,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2025, 4, 15), prev="planned", new="planted"),
                    _sc(date(2025, 5, 10), prev="planted", new="growing"),
                    _sc(date(2025, 6, 1), prev="growing", new="fruiting"),
                    _sc(date(2025, 10, 1), prev="fruiting", new="removed"),
                ]
            )

    # --- Bed B 2025: brassicas + legumes after root veg rotation ---

    def _seed_bed_b_2025(self, bed):
        self._add_plant(bed, "Broccoli", variety="Calabrese",
            start_date=date(2025, 3, 25), status=UserPlant.Status.REMOVED,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 3, 25), prev="planned", new="planted"),
                _sc(date(2025, 4, 25), prev="planted", new="growing"),
                _sc(date(2025, 5, 30), note="Main heads forming.", prev="growing", new="fruiting"),
                _harvest(date(2025, 6, 10), note="Cut main head. Side shoots followed for another 3 weeks."),
                _sc(date(2025, 7, 10), prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Kale", variety="Lacinato",
            start_date=date(2025, 3, 25), status=UserPlant.Status.REMOVED,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 3, 25), prev="planned", new="planted"),
                _sc(date(2025, 4, 20), prev="planted", new="growing"),
                _general(date(2025, 5, 20), note="Cut-and-come-again. Harvesting outer leaves weekly."),
                _sc(date(2025, 10, 15), note="Survived two frosts and sweetened up. Removed after hard freeze.", prev="growing", new="removed"),
            ]
        )
        self._add_plant(bed, "Pea", variety="Sugar Snap",
            start_date=date(2025, 3, 15), status=UserPlant.Status.REMOVED,
            x=4, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 3, 15), prev="planned", new="planted"),
                _sc(date(2025, 4, 10), prev="planted", new="growing"),
                _sc(date(2025, 5, 20), prev="growing", new="fruiting"),
                _harvest(date(2025, 6, 5), note="Peak harvest — sweet, crisp pods. Best eaten right off the vine."),
                _sc(date(2025, 6, 25), note="Succumbed to summer heat.", prev="fruiting", new="removed"),
            ]
        )
        self._add_plant(bed, "Spinach", variety="Bloomsdale",
            start_date=date(2025, 3, 20), status=UserPlant.Status.REMOVED,
            x=0, y=2, width=2, height=1,
            observations=[
                _sc(date(2025, 3, 20), prev="planned", new="planted"),
                _sc(date(2025, 4, 10), prev="planted", new="growing"),
                _harvest(date(2025, 5, 15), note="Four harvests before it bolted."),
                _sc(date(2025, 6, 1), note="Bolted in warm spell.", prev="growing", new="removed"),
            ]
        )
        self._add_plant(bed, "Lettuce", variety="Romaine",
            start_date=date(2025, 3, 20), status=UserPlant.Status.REMOVED,
            x=2, y=2, width=2, height=1,
            observations=[
                _sc(date(2025, 3, 20), prev="planned", new="planted"),
                _sc(date(2025, 4, 10), prev="planted", new="growing"),
                _harvest(date(2025, 5, 25), note="Harvested whole heads. Great crunch."),
                _sc(date(2025, 6, 5), prev="growing", new="removed"),
            ]
        )
        self._add_plant(bed, "Radish", variety="Watermelon",
            start_date=date(2025, 4, 5), status=UserPlant.Status.REMOVED,
            x=4, y=2, width=2, height=1,
            observations=[
                _sc(date(2025, 4, 5), prev="planned", new="planted"),
                _harvest(date(2025, 4, 30), note="Beautiful pink inside. Used as a garnish all week."),
                _sc(date(2025, 4, 30), prev="planted", new="removed"),
            ]
        )

    # --- Bed A 2026: tomatoes back (rotation complete), current season ---

    def _seed_bed_a_2026(self, bed):
        self._add_plant(bed, "Tomato", variety="Brandywine",
            start_date=date(2026, 4, 10), status=UserPlant.Status.GROWING,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 10), note="Transplanted from starts.", prev="planned", new="planted"),
                _sc(date(2026, 5, 15), prev="planted", new="growing"),
                _general(date(2026, 6, 5), note="First flower clusters forming. Looking very healthy."),
            ]
        )
        self._add_plant(bed, "Tomato", variety="Sun Gold Cherry",
            start_date=date(2026, 4, 10), status=UserPlant.Status.GROWING,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 10), prev="planned", new="planted"),
                _sc(date(2026, 5, 15), prev="planted", new="growing"),
            ]
        )
        self._add_plant(bed, "Tomato", variety="San Marzano",
            start_date=date(2026, 4, 15), status=UserPlant.Status.GROWING,
            x=4, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 15), prev="planned", new="planted"),
                _sc(date(2026, 5, 20), prev="planted", new="growing"),
            ]
        )
        self._add_plant(bed, "Bell Pepper", variety="California Wonder",
            start_date=date(2026, 4, 20), status=UserPlant.Status.GROWING,
            x=6, y=0, width=1, height=2,
            observations=[
                _sc(date(2026, 4, 20), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
            ]
        )
        self._add_plant(bed, "Jalapeño",
            start_date=date(2026, 4, 20), status=UserPlant.Status.GROWING,
            x=7, y=0, width=1, height=2,
            observations=[
                _sc(date(2026, 4, 20), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
            ]
        )
        for x, variety in [(0, "Genovese"), (1, "Thai")]:
            self._add_plant(bed, "Basil", variety=variety,
                start_date=date(2026, 5, 1), status=UserPlant.Status.GROWING,
                x=x, y=2, width=1, height=1,
                observations=[
                    _sc(date(2026, 5, 1), prev="planned", new="planted"),
                    _sc(date(2026, 5, 25), prev="planted", new="growing"),
                ]
            )
        self._add_plant(bed, "Marigold",
            start_date=date(2026, 5, 1), status=UserPlant.Status.FRUITING,
            x=2, y=2, width=1, height=1,
            observations=[
                _sc(date(2026, 5, 1), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
                _sc(date(2026, 6, 8), note="First flowers opening.", prev="growing", new="fruiting"),
            ]
        )
        self._add_plant(bed, "Marigold",
            start_date=date(2026, 5, 1), status=UserPlant.Status.GROWING,
            x=3, y=2, width=1, height=1,
            observations=[
                _sc(date(2026, 5, 1), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
            ]
        )

    # --- Bed B 2026: root veg + legumes, current season ---

    def _seed_bed_b_2026(self, bed):
        for x in [0, 1]:
            self._add_plant(bed, "Carrot", variety="Nantes",
                start_date=date(2026, 4, 1), status=UserPlant.Status.GROWING,
                x=x, y=0, width=1, height=2,
                observations=[
                    _sc(date(2026, 4, 1), prev="planned", new="planted"),
                    _sc(date(2026, 5, 10), prev="planted", new="growing"),
                    _general(date(2026, 6, 5), note="Thinned to 2-inch spacing. Looking healthy."),
                ]
            )
        for x in [2, 3]:
            self._add_plant(bed, "Onion", variety="Walla Walla",
                start_date=date(2026, 3, 25), status=UserPlant.Status.GROWING,
                x=x, y=0, width=1, height=1,
                observations=[
                    _sc(date(2026, 3, 25), prev="planned", new="planted"),
                    _sc(date(2026, 4, 25), prev="planted", new="growing"),
                ]
            )
        self._add_plant(bed, "Lettuce", variety="Spring Mix",
            start_date=date(2026, 3, 20), status=UserPlant.Status.GROWING,
            x=4, y=0, width=2, height=1,
            observations=[
                _sc(date(2026, 3, 20), prev="planned", new="planted"),
                _sc(date(2026, 4, 10), prev="planted", new="growing"),
                _harvest(date(2026, 5, 5), note="First harvest of spring!"),
                _general(date(2026, 6, 1), note="Second planting doing well."),
            ]
        )
        self._add_plant(bed, "Spinach", variety="Tyee",
            start_date=date(2026, 3, 20), status=UserPlant.Status.GROWING,
            x=0, y=3, width=2, height=1,
            observations=[
                _sc(date(2026, 3, 20), prev="planned", new="planted"),
                _sc(date(2026, 4, 10), prev="planted", new="growing"),
                _harvest(date(2026, 5, 20), note="Harvested twice. Holding well in cooler weather."),
            ]
        )
        for x in [2, 3]:
            self._add_plant(bed, "Radish", variety="Cherry Belle",
                start_date=date(2026, 4, 5), status=UserPlant.Status.FRUITING,
                x=x, y=3, width=1, height=1,
                observations=[
                    _sc(date(2026, 4, 5), prev="planned", new="planted"),
                    _sc(date(2026, 4, 28), note="Radishes sizing up nicely.", prev="planted", new="fruiting"),
                    _harvest(date(2026, 5, 1), note="First harvest. Direct-sowed second planting same day."),
                    _harvest(date(2026, 5, 25), note="Second planting harvested."),
                ]
            )
        for x in [4, 5]:
            self._add_plant(bed, "Pea", variety="Oregon Sugar Pod",
                start_date=date(2026, 3, 15), status=UserPlant.Status.FRUITING,
                x=x, y=2, width=1, height=2,
                observations=[
                    _sc(date(2026, 3, 15), prev="planned", new="planted"),
                    _sc(date(2026, 4, 10), prev="planted", new="growing"),
                    _sc(date(2026, 5, 25), note="Pods forming!", prev="growing", new="fruiting"),
                    _harvest(date(2026, 6, 8), note="First pea harvest of 2026. Incredibly sweet."),
                ]
            )

    # --- Herb Bed: perennials established 2025, persisting into 2026 ---

    def _seed_herb_bed(self, bed):
        self._add_plant(bed, "Rosemary",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=0, y=0, width=2, height=1,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 1), prev="planted", new="growing"),
                _sc(date(2026, 3, 15), note="Came through winter well. New growth starting.", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Thyme",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=2, y=0, width=1, height=1,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 1), prev="planted", new="growing"),
                _sc(date(2026, 4, 1), note="Overwintered without help. Very tough plant.", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Chives",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=3, y=0, width=1, height=1,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 5, 15), prev="planted", new="growing"),
                _sc(date(2026, 3, 20), note="First chives poking up — spring is here!", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Oregano",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=4, y=0, width=2, height=1,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 1), prev="planted", new="growing"),
                _sc(date(2026, 4, 5), prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Parsley", variety="Flat-leaf Italian",
            start_date=date(2025, 4, 25), status=UserPlant.Status.GROWING,
            x=0, y=1, width=2, height=1,
            observations=[
                _sc(date(2025, 4, 25), prev="planned", new="planted"),
                _sc(date(2025, 6, 10), prev="planted", new="growing"),
                _general(date(2026, 3, 20), note="Biennial back for year 2. Starting to bolt — saving seeds."),
            ]
        )
        self._add_plant(bed, "Mint", variety="Spearmint",
            start_date=date(2025, 5, 5), status=UserPlant.Status.GROWING,
            notes="Planted in a submerged container to prevent spreading.",
            x=2, y=1, width=2, height=1,
            observations=[
                _sc(date(2025, 5, 5), prev="planned", new="planted"),
                _sc(date(2025, 6, 1), prev="planted", new="growing"),
                _sc(date(2026, 3, 25), prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Dill",
            start_date=date(2026, 4, 15), status=UserPlant.Status.GROWING,
            notes="Placed at the back of the herb bed, away from the carrot beds (allelopathic at maturity).",
            x=4, y=1, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 15), prev="planned", new="planted"),
                _sc(date(2026, 5, 15), prev="planted", new="growing"),
            ]
        )

    # --- Flower Border: annuals for 2026 + lavender perennial from 2025 ---

    def _seed_flower_border(self, bed):
        self._add_plant(bed, "Sunflower", variety="Mammoth",
            start_date=date(2026, 4, 20), status=UserPlant.Status.GROWING,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 20), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
                _general(date(2026, 6, 10), note="Already 3 feet tall and heading toward the fence."),
            ]
        )
        self._add_plant(bed, "Nasturtium",
            start_date=date(2026, 4, 20), status=UserPlant.Status.FRUITING,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 20), prev="planned", new="planted"),
                _sc(date(2026, 5, 20), prev="planted", new="growing"),
                _sc(date(2026, 6, 8), note="First orange and yellow flowers. Tossed some in a salad!", prev="growing", new="fruiting"),
            ]
        )
        self._add_plant(bed, "Zinnia", variety="Giant Cactus Mix",
            start_date=date(2026, 4, 25), status=UserPlant.Status.GROWING,
            x=4, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 25), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
            ]
        )
        self._add_plant(bed, "Marigold", variety="French",
            start_date=date(2026, 4, 25), status=UserPlant.Status.FRUITING,
            x=6, y=0, width=2, height=2,
            observations=[
                _sc(date(2026, 4, 25), prev="planned", new="planted"),
                _sc(date(2026, 5, 25), prev="planted", new="growing"),
                _sc(date(2026, 6, 9), note="Blooming! Border is starting to look lush.", prev="growing", new="fruiting"),
            ]
        )
        self._add_plant(bed, "Lavender",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=8, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 15), prev="planted", new="growing"),
                _sc(date(2025, 7, 10), note="Beautiful purple blooms. Bees everywhere!", prev="growing", new="fruiting"),
                _sc(date(2025, 10, 1), prev="fruiting", new="dormant"),
                _sc(date(2026, 4, 15), note="Pruned back. New growth coming in strong.", prev="dormant", new="growing"),
            ]
        )

    # ------------------------------------------------------------------
    # Garden 2 - Side Yard Herb & Fruit Patch
    # 12 ft wide x 10 ft tall, east-facing (orientation=90)
    # 2 beds, 2 seasons (2025-2026)
    # ------------------------------------------------------------------

    def _seed_side_yard_garden(self, user):
        garden = Garden.objects.create(
            owner=user,
            name="Side Yard Herb & Fruit Patch",
            description=(
                "A smaller east-facing garden focused on perennial herbs and soft fruits. "
                "Lower maintenance than the backyard but productive all season."
            ),
            length=10, width=12, unit="ft", orientation=90,
        )

        fruit_bed = GardenBed.objects.create(
            garden=garden, name="Fruit Bed",
            length=4, width=6, unit="ft", avg_sunlight_hours=6,
            soil_type="Acidic loam with extra compost",
            notes="Strawberry runners trimmed back each spring. Raspberries tied to wire along the fence.",
        )
        herb_corner = GardenBed.objects.create(
            garden=garden, name="Herb Corner",
            length=4, width=4, unit="ft", avg_sunlight_hours=5,
            soil_type="Sandy, well-draining",
            notes="Primarily perennial herbs. Low-maintenance once established.",
        )

        BedPlacement.objects.create(bed=fruit_bed, garden=garden, x=1, y=1)
        BedPlacement.objects.create(bed=herb_corner, garden=garden, x=7, y=1)

        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="fountain", x=4, y=6, width=1.5, height=1.5,
        )
        GardenFeaturePlacement.objects.create(
            user=user, garden=garden, object_type="pot", x=1, y=7, width=1, height=1,
        )

        self._seed_fruit_bed(fruit_bed)
        self._seed_herb_corner(herb_corner)

    # --- Fruit Bed: strawberries, raspberries, mint ---

    def _seed_fruit_bed(self, bed):
        for x in range(4):
            self._add_plant(bed, "Strawberry", variety="Seascape",
                start_date=date(2025, 4, 10), status=UserPlant.Status.FRUITING,
                x=x, y=0, width=1, height=1,
                observations=[
                    _sc(date(2025, 4, 10), prev="planned", new="planted"),
                    _sc(date(2025, 5, 20), prev="planted", new="growing"),
                    _sc(date(2025, 6, 15), note="Everbearing — first berries forming.", prev="growing", new="fruiting"),
                    _harvest(date(2025, 7, 1), note="First strawberry harvest!"),
                    _sc(date(2025, 10, 15), prev="fruiting", new="dormant"),
                    _sc(date(2026, 4, 5), note="Coming back strong. Trimmed runners to keep tidy.", prev="dormant", new="growing"),
                    _sc(date(2026, 5, 25), note="Second-year plants setting fruit.", prev="growing", new="fruiting"),
                    _harvest(date(2026, 6, 8), note="First harvest of 2026. Better crop than last year!"),
                ]
            )
        for x in [0, 1]:
            self._add_plant(bed, "Raspberry", variety="Heritage",
                start_date=date(2025, 4, 15), status=UserPlant.Status.GROWING,
                x=x, y=2, width=1, height=2,
                observations=[
                    _sc(date(2025, 4, 15), prev="planned", new="planted"),
                    _sc(date(2025, 6, 1), prev="planted", new="growing"),
                    _sc(date(2025, 8, 10), note="Fall-bearing variety setting its first crop.", prev="growing", new="fruiting"),
                    _harvest(date(2025, 9, 5), note="First year harvest — small but promising. Canes will strengthen next season."),
                    _sc(date(2025, 11, 1), note="Cut floricanes to ground. Primocanes left for next year.", prev="fruiting", new="dormant"),
                    _sc(date(2026, 4, 20), note="New growth appearing. Tied to wire along fence.", prev="dormant", new="growing"),
                ]
            )
        self._add_plant(bed, "Mint", variety="Peppermint",
            start_date=date(2025, 5, 10), status=UserPlant.Status.GROWING,
            notes="Potted and sunk into the bed to prevent spreading.",
            x=2, y=2, width=2, height=2,
            observations=[
                _sc(date(2025, 5, 10), prev="planned", new="planted"),
                _sc(date(2025, 6, 5), prev="planted", new="growing"),
                _sc(date(2026, 3, 30), note="Overwintered well in the pot.", prev="dormant", new="growing"),
            ]
        )

    # --- Herb Corner: perennial herbs established 2025 ---

    def _seed_herb_corner(self, bed):
        self._add_plant(bed, "Sage",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=0, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 15), prev="planted", new="growing"),
                _sc(date(2026, 4, 1), note="Pruned lightly after winter. Woody but very healthy.", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Lavender", variety="Hidcote",
            start_date=date(2025, 4, 20), status=UserPlant.Status.GROWING,
            x=2, y=0, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 20), prev="planned", new="planted"),
                _sc(date(2025, 6, 20), prev="planted", new="growing"),
                _sc(date(2025, 7, 5), note="Blooming beautifully.", prev="growing", new="fruiting"),
                _sc(date(2025, 10, 1), prev="fruiting", new="dormant"),
                _sc(date(2026, 4, 10), note="Pruned to encourage bushy new growth.", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Rosemary", variety="Tuscan Blue",
            start_date=date(2025, 4, 25), status=UserPlant.Status.GROWING,
            x=0, y=2, width=2, height=2,
            observations=[
                _sc(date(2025, 4, 25), prev="planned", new="planted"),
                _sc(date(2025, 6, 10), prev="planted", new="growing"),
                _sc(date(2026, 4, 1), note="Well established. Harvesting sprigs regularly for cooking.", prev="dormant", new="growing"),
            ]
        )
        self._add_plant(bed, "Echinacea",
            start_date=date(2025, 5, 1), status=UserPlant.Status.GROWING,
            x=2, y=2, width=2, height=2,
            observations=[
                _sc(date(2025, 5, 1), prev="planned", new="planted"),
                _sc(date(2025, 6, 20), prev="planted", new="growing"),
                _sc(date(2025, 7, 20), note="Beautiful purple coneflowers. Bees and butterflies everywhere!", prev="growing", new="fruiting"),
                _sc(date(2025, 10, 1), note="Left seed heads standing for the birds.", prev="fruiting", new="dormant"),
                _sc(date(2026, 4, 20), note="New rosettes coming up. Second-year plants will be much stronger.", prev="dormant", new="growing"),
            ]
        )
