from rest_framework import serializers

from gardens.models import Garden, GardenBed
from plants.models import UserPlant

from .models import AIConversation, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "role", "content", "input_tokens", "output_tokens", "created_at"]
        read_only_fields = ["id", "role", "input_tokens", "output_tokens", "created_at"]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "scope", "garden", "bed", "plant", "messages", "created_at", "updated_at"]
        read_only_fields = ["id", "messages", "created_at", "updated_at"]

    def validate(self, data):
        scope = data.get("scope")
        garden = data.get("garden")
        bed = data.get("bed")
        plant = data.get("plant")
        request = self.context["request"]

        if scope == AIConversation.Scope.GARDEN:
            if not garden:
                raise serializers.ValidationError({"garden": "Required for garden scope."})
            if not Garden.objects.filter(pk=garden.pk, owner=request.user).exists():
                raise serializers.ValidationError({"garden": "Not found."})
            data["bed"] = None
            data["plant"] = None

        elif scope == AIConversation.Scope.BED:
            if not bed:
                raise serializers.ValidationError({"bed": "Required for bed scope."})
            if not GardenBed.objects.filter(pk=bed.pk, garden__owner=request.user).exists():
                raise serializers.ValidationError({"bed": "Not found."})
            data["garden"] = None
            data["plant"] = None

        elif scope == AIConversation.Scope.PLANT:
            if not plant:
                raise serializers.ValidationError({"plant": "Required for plant scope."})
            if not UserPlant.objects.filter(pk=plant.pk, bed__garden__owner=request.user).exists():
                raise serializers.ValidationError({"plant": "Not found."})
            data["garden"] = None
            data["bed"] = None

        return data



class AIConversationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoints — omits message history."""

    message_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "scope", "garden", "bed", "plant", "message_count", "created_at", "updated_at"]
        read_only_fields = fields


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(min_length=1, max_length=4000)
