from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models import Count
from django.utils import timezone
from openai import OpenAIError
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from gardens.models import GardenBed
from plants.models import Observation, Plant, PlantPlacement, UserPlant

from .ai_service import send_message, send_message_with_tools
from .context_builder import build_context
from .models import AIConversation, AIMessage
from .serializers import (
    AIConversationListSerializer,
    AIConversationSerializer,
    SendMessageSerializer,
)

_HISTORY_LIMIT = 20
_DAILY_MESSAGE_LIMIT = 20

_TOOL_ADD_PLANT = {
    "name": "add_plant_to_bed",
    "description": (
        "Add a plant from the catalog to the current bed. "
        "Use this when the user asks to add, plant, or grow a specific plant."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "catalog_id": {
                "type": "string",
                "description": "The catalog plant ID from the Plant Catalog section in the context.",
            },
            "bed_id": {
                "type": "string",
                "description": "The bed ID where the plant should be added.",
            },
            "status": {
                "type": "string",
                "enum": ["planned", "planted", "growing", "fruiting", "dormant", "removed"],
                "description": "Initial status. Defaults to 'planned' if the user does not specify.",
            },
            "variety": {
                "type": "string",
                "description": "Optional variety or cultivar name.",
            },
            "start_date": {
                "type": "string",
                "description": "Optional planting date in YYYY-MM-DD format.",
            },
        },
        "required": ["catalog_id", "bed_id"],
    },
}

_TOOL_CHANGE_STATUS = {
    "name": "change_plant_status",
    "description": (
        "Change the status of an existing plant. "
        "Use this when the user says a plant is now growing, fruiting, harvested, removed, etc."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "plant_id": {
                "type": "string",
                "description": "The UserPlant ID from the context.",
            },
            "new_status": {
                "type": "string",
                "enum": ["planned", "planted", "growing", "fruiting", "dormant", "removed"],
                "description": "The new status for the plant.",
            },
        },
        "required": ["plant_id", "new_status"],
    },
}

_TOOL_LOG_OBSERVATION = {
    "name": "log_observation",
    "description": (
        "Log an observation on a plant — harvest, pest, disease, weather, or a general note. "
        "Use this when the user reports something happened to or was noticed about a specific plant."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "plant_id": {
                "type": "string",
                "description": "The UserPlant ID from the context.",
            },
            "type": {
                "type": "string",
                "enum": ["general", "harvest", "pest", "disease", "weather", "transplant"],
                "description": "The type of observation.",
            },
            "note": {
                "type": "string",
                "description": "The observation note text.",
            },
            "observed_date": {
                "type": "string",
                "description": "Optional observation date in YYYY-MM-DD format. Defaults to today.",
            },
        },
        "required": ["plant_id", "type", "note"],
    },
}

_TOOL_DELETE_PLANT = {
    "name": "delete_plant",
    "description": (
        "Permanently delete a plant from the garden. "
        "Only call this after the user has explicitly confirmed the deletion — it cannot be undone."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "plant_id": {
                "type": "string",
                "description": "The UserPlant ID to delete.",
            },
            "confirm": {
                "type": "boolean",
                "description": (
                    "Must be true. Set this only after the user has explicitly confirmed "
                    "they want to permanently delete the plant."
                ),
            },
        },
        "required": ["plant_id", "confirm"],
    },
}

_TOOL_MOVE_PLANT = {
    "name": "move_plant",
    "description": (
        "Move a plant to a different bed in the same garden. "
        "Its current canvas placement will be removed and it will arrive in the target bed unplaced."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "plant_id": {
                "type": "string",
                "description": "The UserPlant ID to move.",
            },
            "target_bed_id": {
                "type": "string",
                "description": "The bed_id of the destination bed from the context.",
            },
        },
        "required": ["plant_id", "target_bed_id"],
    },
}

_BED_TOOLS = [_TOOL_ADD_PLANT, _TOOL_CHANGE_STATUS, _TOOL_LOG_OBSERVATION, _TOOL_DELETE_PLANT, _TOOL_MOVE_PLANT]
_PLANT_TOOLS = [_TOOL_CHANGE_STATUS, _TOOL_LOG_OBSERVATION, _TOOL_DELETE_PLANT, _TOOL_MOVE_PLANT]


def _local_date(user):
    try:
        tz_name = user.userprofile.timezone
        user_tz = ZoneInfo(tz_name)
    except (AttributeError, ZoneInfoNotFoundError):
        user_tz = ZoneInfo("UTC")
    return datetime.now(tz=user_tz).date()


def _exec_add_plant(user, args):
    catalog_id = args.get("catalog_id")
    bed_id = args.get("bed_id")
    raw_status = args.get("status", UserPlant.Status.PLANNED)
    variety = args.get("variety", "")
    start_date = args.get("start_date") or None

    try:
        plant = Plant.objects.get(pk=catalog_id)
    except Plant.DoesNotExist:
        return {"message": f"Plant with ID {catalog_id} not found in catalog.", "error": True}

    try:
        bed = GardenBed.objects.get(pk=bed_id, garden__owner=user)
    except GardenBed.DoesNotExist:
        return {"message": "Bed not found.", "error": True}

    plant_status = raw_status if raw_status in UserPlant.Status.values else UserPlant.Status.PLANNED

    user_plant = UserPlant.objects.create(
        bed=bed,
        plant=plant,
        status=plant_status,
        variety=variety,
        start_date=start_date,
    )

    Observation.objects.create(
        user_plant=user_plant,
        observed_date=start_date or _local_date(user),
        type=Observation.Type.STATUS_CHANGE,
        previous_status="",
        new_status=plant_status,
    )

    return {
        "message": f"Added {plant.common_name} to {bed.name} with status '{plant_status}'.",
        "type": "add_plant",
        "plantId": str(user_plant.pk),
        "bedId": str(bed.pk),
        "plantName": plant.common_name,
        "bedName": bed.name,
    }


def _exec_change_status(user, args):
    plant_id = args.get("plant_id")
    new_status = args.get("new_status")

    try:
        user_plant = UserPlant.objects.select_related("plant", "bed").get(
            pk=plant_id, bed__garden__owner=user
        )
    except UserPlant.DoesNotExist:
        return {"message": "Plant not found.", "error": True}

    if new_status not in UserPlant.Status.values:
        return {"message": f"Invalid status: {new_status}", "error": True}

    old_status = user_plant.status
    user_plant.status = new_status
    user_plant.save()

    Observation.objects.create(
        user_plant=user_plant,
        observed_date=_local_date(user),
        type=Observation.Type.STATUS_CHANGE,
        previous_status=old_status,
        new_status=new_status,
    )

    return {
        "message": f"Changed {user_plant.plant.common_name} from '{old_status}' to '{new_status}'.",
        "type": "change_plant_status",
        "plantId": str(user_plant.pk),
        "bedId": str(user_plant.bed.pk),
        "plantName": user_plant.plant.common_name,
        "oldStatus": old_status,
        "newStatus": new_status,
    }


def _exec_log_observation(user, args):
    plant_id = args.get("plant_id")
    obs_type = args.get("type")
    note = args.get("note", "")
    observed_date = args.get("observed_date") or None

    try:
        user_plant = UserPlant.objects.select_related("plant", "bed").get(
            pk=plant_id, bed__garden__owner=user
        )
    except UserPlant.DoesNotExist:
        return {"message": "Plant not found.", "error": True}

    valid_types = [t for t in Observation.Type.values if t != Observation.Type.STATUS_CHANGE]
    if obs_type not in valid_types:
        return {"message": f"Invalid observation type: {obs_type}", "error": True}

    Observation.objects.create(
        user_plant=user_plant,
        observed_date=observed_date or _local_date(user),
        type=obs_type,
        note=note,
    )

    return {
        "message": f"Logged {obs_type} observation for {user_plant.plant.common_name}.",
        "type": "log_observation",
        "plantId": str(user_plant.pk),
        "bedId": str(user_plant.bed.pk),
        "plantName": user_plant.plant.common_name,
        "observationType": obs_type,
    }


def _exec_delete_plant(user, args):
    plant_id = args.get("plant_id")
    confirm = args.get("confirm", False)

    if not confirm:
        return {"message": "Deletion not confirmed. Ask the user to confirm before deleting.", "error": True}

    try:
        user_plant = UserPlant.objects.select_related("plant", "bed").get(
            pk=plant_id, bed__garden__owner=user
        )
    except UserPlant.DoesNotExist:
        return {"message": "Plant not found.", "error": True}

    plant_name = user_plant.plant.common_name
    bed_id = str(user_plant.bed.pk)
    bed_name = user_plant.bed.name
    user_plant.delete()

    return {
        "message": f"Deleted {plant_name} from {bed_name}.",
        "type": "delete_plant",
        "plantId": plant_id,
        "bedId": bed_id,
        "plantName": plant_name,
        "bedName": bed_name,
    }


def _exec_move_plant(user, args):
    plant_id = args.get("plant_id")
    target_bed_id = args.get("target_bed_id")

    try:
        user_plant = UserPlant.objects.select_related("plant", "bed").get(
            pk=plant_id, bed__garden__owner=user
        )
    except UserPlant.DoesNotExist:
        return {"message": "Plant not found.", "error": True}

    try:
        target_bed = GardenBed.objects.get(pk=target_bed_id, garden__owner=user)
    except GardenBed.DoesNotExist:
        return {"message": "Target bed not found.", "error": True}

    if user_plant.bed == target_bed:
        return {"message": f"{user_plant.plant.common_name} is already in {target_bed.name}.", "error": True}

    old_bed = user_plant.bed
    user_plant.bed = target_bed
    user_plant.save()
    PlantPlacement.objects.filter(user_plant=user_plant).delete()
    Observation.objects.create(
        user_plant=user_plant,
        observed_date=_local_date(user),
        type=Observation.Type.TRANSPLANT,
        note=f"Moved from {old_bed.name} to {target_bed.name}",
    )

    return {
        "message": f"Moved {user_plant.plant.common_name} from {old_bed.name} to {target_bed.name}.",
        "type": "move_plant",
        "plantId": str(user_plant.pk),
        "bedId": str(target_bed.pk),
        "oldBedId": str(old_bed.pk),
        "plantName": user_plant.plant.common_name,
        "oldBedName": old_bed.name,
        "newBedName": target_bed.name,
    }


def _make_tool_executor(user):
    def executor(tool_name, args):
        if tool_name == "add_plant_to_bed":
            return _exec_add_plant(user, args)
        if tool_name == "change_plant_status":
            return _exec_change_status(user, args)
        if tool_name == "log_observation":
            return _exec_log_observation(user, args)
        if tool_name == "delete_plant":
            return _exec_delete_plant(user, args)
        if tool_name == "move_plant":
            return _exec_move_plant(user, args)
        return {"message": f"Unknown tool: {tool_name}", "error": True}
    return executor


class AIConversationViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "conversation_id"

    def get_serializer_class(self):
        if self.action == "list":
            return AIConversationListSerializer
        return AIConversationSerializer

    def get_queryset(self):
        qs = AIConversation.objects.filter(user=self.request.user)

        if garden_id := self.request.query_params.get("garden"):
            qs = qs.filter(scope=AIConversation.Scope.GARDEN, garden_id=garden_id)
        elif bed_id := self.request.query_params.get("bed"):
            qs = qs.filter(scope=AIConversation.Scope.BED, bed_id=bed_id)
        elif plant_id := self.request.query_params.get("plant"):
            qs = qs.filter(scope=AIConversation.Scope.PLANT, plant_id=plant_id)

        if self.action == "list":
            qs = qs.annotate(message_count=Count("messages"))

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="message")
    def message(self, request, conversation_id=None):
        try:
            conversation = AIConversation.objects.get(pk=conversation_id, user=request.user)
        except AIConversation.DoesNotExist as err:
            raise NotFound("Conversation not found.") from err

        today = timezone.now().date()
        daily_count = AIMessage.objects.filter(
            conversation__user=request.user,
            role=AIMessage.Role.USER,
            created_at__date=today,
        ).count()
        if daily_count >= _DAILY_MESSAGE_LIMIT:
            return Response(
                {"detail": "Daily message limit reached. Try again tomorrow."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.USER,
            content=serializer.validated_data["content"],
        )

        history = list(
            AIMessage.objects.filter(conversation=conversation)
            .order_by("created_at")
            .values("role", "content")
        )[-_HISTORY_LIMIT:]

        system = build_context(conversation)

        try:
            if conversation.scope == AIConversation.Scope.BED:
                content, input_tokens, output_tokens, action_result = send_message_with_tools(
                    system, history, _BED_TOOLS, _make_tool_executor(request.user)
                )
            elif conversation.scope == AIConversation.Scope.PLANT:
                content, input_tokens, output_tokens, action_result = send_message_with_tools(
                    system, history, _PLANT_TOOLS, _make_tool_executor(request.user)
                )
            else:
                content, input_tokens, output_tokens = send_message(system, history)
                action_result = None
        except OpenAIError:
            return Response(
                {"detail": "AI service unavailable. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.ASSISTANT,
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        conversation = AIConversation.objects.prefetch_related("messages").get(pk=conversation_id)
        data = AIConversationSerializer(conversation, context={"request": request}).data
        if action_result and not action_result.get("error"):
            data["action"] = action_result
        return Response(data, status=status.HTTP_200_OK)
