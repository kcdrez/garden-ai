from rest_framework import serializers

from .models import Garden


class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
            "owner",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        return super().create(validated_data)
