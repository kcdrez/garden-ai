import uuid
from django.contrib.auth.models import User
from django.db import models


class Garden(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    owner = models.ForeignKey(User, related_name="gardens", on_delete=models.CASCADE)

    def __str__(self):
        return self.name
