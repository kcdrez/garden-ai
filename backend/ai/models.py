from django.contrib.auth.models import User
from django.db import models

from core.models import BaseModel
from gardens.models import Garden, GardenBed
from plants.models import UserPlant


class AIConversation(BaseModel):
    class Scope(models.TextChoices):
        GARDEN = "garden", "Garden"
        BED = "bed", "Bed"
        PLANT = "plant", "Plant"

    user = models.ForeignKey(User, related_name="ai_conversations", on_delete=models.CASCADE)
    scope = models.CharField(max_length=10, choices=Scope.choices)
    garden = models.ForeignKey(
        Garden, related_name="ai_conversations", on_delete=models.CASCADE, null=True, blank=True
    )
    bed = models.ForeignKey(
        GardenBed, related_name="ai_conversations", on_delete=models.CASCADE, null=True, blank=True
    )
    plant = models.ForeignKey(
        UserPlant, related_name="ai_conversations", on_delete=models.CASCADE, null=True, blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.scope == self.Scope.GARDEN:
            return f"Conversation about garden {self.garden_id}"
        if self.scope == self.Scope.BED:
            return f"Conversation about bed {self.bed_id}"
        return f"Conversation about plant {self.plant_id}"


class AIMessage(BaseModel):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    conversation = models.ForeignKey(AIConversation, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    input_tokens = models.PositiveIntegerField(null=True, blank=True)
    output_tokens = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
