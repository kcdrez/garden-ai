from rest_framework import serializers
from .models import Garden


class GardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = "__all__"
        read_only_fields = ["owner"]