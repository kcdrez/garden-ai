import math

UNIT_TO_FEET = {
    "ft": 1.0,
    "in": 1 / 12,
    "cm": 1 / 30.48,
    "m": 3.28084,
}


def to_feet(dimension, unit):
    return dimension * UNIT_TO_FEET.get(unit, 1.0)


def grid_dimensions(length, width, unit):
    factor = UNIT_TO_FEET.get(unit, 1.0)
    cols = math.ceil(width * factor)
    rows = math.ceil(length * factor)
    return cols, rows
