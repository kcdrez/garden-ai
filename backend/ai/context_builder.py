from django.db.models import Prefetch

from gardens.models import Garden, GardenBed
from plants.models import Observation, PlantPlacement, UserPlant

from .models import AIConversation

_PERSONA = (
    "You are a knowledgeable gardening assistant. "
    "Be specific and practical. Base your advice on the context provided. "
    "If you don't know something, say so. "
    "Plants are placed on a freeform square-foot canvas: coordinates are measured in feet from the "
    "top-left corner of the bed, and each plant's footprint (width x height) is user-defined and "
    "not snapped to a grid — a plant placed at 1.5 x 2.0 ft occupies that exact area."
)


def build_context(conversation: AIConversation) -> str:
    if conversation.scope == AIConversation.Scope.GARDEN:
        return _build_garden_context(conversation.garden)
    if conversation.scope == AIConversation.Scope.BED:
        return _build_bed_context(conversation.bed)
    return _build_plant_context(conversation.plant)


def _bed_meta(bed: GardenBed) -> str:
    parts = [f"{bed.length} {bed.unit} x {bed.width} {bed.unit}"]
    if bed.facing:
        parts.append(f"{bed.get_facing_display()}-facing")
    if bed.avg_sunlight_hours:
        parts.append(f"{bed.avg_sunlight_hours} hrs sunlight")
    return " · ".join(parts)


def _format_obs(o: Observation) -> str:
    entry = f"  · {o.observed_date} ({o.type})"
    if o.type == Observation.Type.STATUS_CHANGE:
        entry += f": {o.previous_status or '—'} → {o.new_status or '—'}"
    if o.note:
        entry += f" — {o.note}"
    return entry


def _plant_label(up: UserPlant) -> str:
    return f"{up.plant.common_name} ({up.variety})" if up.variety else up.plant.common_name


def _build_garden_context(garden: Garden) -> str:
    beds = GardenBed.objects.filter(garden=garden).prefetch_related("user_plants__plant").order_by("name")

    lines = [_PERSONA, "", f"## Garden: {garden.name}"]
    if garden.description:
        lines.append(garden.description)
    if garden.length and garden.width:
        lines.append(f"Dimensions: {garden.length} {garden.unit} x {garden.width} {garden.unit}")

    bed_list = list(beds)
    lines += ["", f"### Beds ({len(bed_list)}):"]

    for bed in bed_list:
        lines += ["", f"**{bed.name}**", _bed_meta(bed)]
        plants = list(bed.user_plants.all())
        if plants:
            summary = ", ".join(f"{_plant_label(p)} ({p.status})" for p in plants)
            lines.append(f"Plants: {summary}")
        else:
            lines.append("Plants: none")

    return "\n".join(lines)


def _build_bed_context(bed: GardenBed) -> str:
    bed = GardenBed.objects.select_related("garden").get(pk=bed.pk)

    plants = (
        UserPlant.objects.filter(bed=bed)
        .select_related("plant")
        .prefetch_related(
            "placement",
            Prefetch(
                "observations",
                queryset=Observation.objects.order_by("observed_date", "created_at"),
            ),
        )
        .order_by("plant__common_name")
    )

    other_beds = GardenBed.objects.filter(garden=bed.garden).exclude(pk=bed.pk).order_by("name")

    lines = [_PERSONA, "", f"## Garden: {bed.garden.name}"]
    if bed.garden.length and bed.garden.width:
        lines.append(f"Dimensions: {bed.garden.length} {bed.garden.unit} x {bed.garden.width} {bed.garden.unit}")
    other_names = [b.name for b in other_beds]
    if other_names:
        lines.append(f"Other beds: {', '.join(other_names)}")

    lines += ["", f"## Bed: {bed.name}", _bed_meta(bed)]
    if bed.soil_type:
        lines.append(f"Soil: {bed.soil_type}")
    if bed.notes:
        lines.append(f"Notes: {bed.notes}")

    plant_list = list(plants)
    lines += ["", f"### Plants ({len(plant_list)}):"]

    for up in plant_list:
        lines += ["", f"**{_plant_label(up)}**"]
        lines.append(f"Species: {up.plant.scientific_name or up.plant.common_name} ({up.plant.category})")
        if up.plant.description:
            lines.append(f"Description: {up.plant.description}")

        status_line = f"Status: {up.status}"
        if up.start_date:
            status_line += f" · Planted: {up.start_date}"
        lines.append(status_line)

        try:
            p = up.placement
            pos = f"Position: ({p.x:.1f}, {p.y:.1f}) ft from top-left, footprint: {p.width:.1f} x {p.height:.1f} ft"
            if up.plant.default_spacing_ft:
                pos += f" (catalog recommends {up.plant.default_spacing_ft} ft spacing)"
            lines.append(pos)
        except PlantPlacement.DoesNotExist:
            lines.append("Not yet placed — user is planning to add this plant to the bed")

        if up.notes:
            lines.append(f"Notes: {up.notes}")

        all_obs = list(up.observations.all())
        recent = all_obs[-3:]
        if recent:
            lines.append(f"Recent observations (last {len(recent)}):")
            lines.extend(_format_obs(o) for o in recent)

    return "\n".join(lines)


def _build_plant_context(user_plant: UserPlant) -> str:
    user_plant = UserPlant.objects.select_related("plant", "bed", "bed__garden").get(pk=user_plant.pk)
    bed = user_plant.bed
    garden = bed.garden

    other_plants = (
        UserPlant.objects.filter(bed=bed)
        .exclude(pk=user_plant.pk)
        .select_related("plant")
        .order_by("plant__common_name")
    )

    all_obs = list(Observation.objects.filter(user_plant=user_plant).order_by("observed_date", "created_at"))
    total_obs = len(all_obs)
    recent_obs = all_obs[-10:]

    try:
        placement = user_plant.placement
    except PlantPlacement.DoesNotExist:
        placement = None

    lines = [_PERSONA, "", f"## Garden: {garden.name}"]
    if garden.length and garden.width:
        lines.append(f"Dimensions: {garden.length} {garden.unit} x {garden.width} {garden.unit}")

    lines += ["", f"## Bed: {bed.name}", _bed_meta(bed)]
    if bed.soil_type:
        lines.append(f"Soil: {bed.soil_type}")

    other_list = list(other_plants)
    if other_list:
        others = ", ".join(f"{_plant_label(p)} ({p.status})" for p in other_list)
        lines.append(f"Other plants in this bed: {others}")

    lines += ["", f"## Plant: {_plant_label(user_plant)}"]
    plant = user_plant.plant
    lines.append(f"Species: {plant.scientific_name or plant.common_name} ({plant.category})")
    if plant.description:
        lines.append(f"Description: {plant.description}")

    status_line = f"Status: {user_plant.status}"
    if user_plant.start_date:
        status_line += f" · Planted: {user_plant.start_date}"
    lines.append(status_line)

    if placement:
        pos = (
            f"Position: ({placement.x:.1f}, {placement.y:.1f}) ft from top-left, "
            f"footprint: {placement.width:.1f} x {placement.height:.1f} ft"
        )
        if plant.default_spacing_ft:
            pos += f" (catalog recommends {plant.default_spacing_ft} ft spacing)"
        lines.append(pos)
    else:
        lines.append("Not yet placed on canvas")

    if user_plant.notes:
        lines.append(f"Notes: {user_plant.notes}")

    if recent_obs:
        truncated = total_obs > 10
        header = f"### Observation History ({total_obs} total"
        header += ", showing most recent 10):" if truncated else "):"
        lines += ["", header]
        lines.extend(_format_obs(o) for o in recent_obs)

    return "\n".join(lines)
