from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Observation, UserPlant


@receiver(post_save, sender=Observation)
@receiver(post_delete, sender=Observation)
def sync_plant_start_date(sender, instance, **kwargs):
    if instance.type != Observation.Type.STATUS_CHANGE:
        return
    earliest = (
        instance.user_plant.observations
        .filter(type=Observation.Type.STATUS_CHANGE)
        .order_by("observed_date")
        .values_list("observed_date", flat=True)
        .first()
    )
    UserPlant.objects.filter(pk=instance.user_plant_id).update(start_date=earliest)
