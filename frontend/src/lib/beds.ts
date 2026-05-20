import { BED_FACINGS, type GardenBed } from '@/types/gardens';

export function formatDimensions(bed: GardenBed): string {
  const parts = [bed.length, bed.width];
  if (bed.depth) parts.push(bed.depth);
  return `${parts.join(' × ')} ${bed.unit}`;
}

export function facingLabel(value: string): string {
  return BED_FACINGS.find((f) => f.value === value)?.label ?? value;
}

export function bedHasDetails(bed: GardenBed, includeNotes = true): boolean {
  return !!(bed.facing || bed.avgSunlightHours != null || bed.soilType || (includeNotes && bed.notes));
}

const UNIT_TO_FEET: Record<string, number> = {
  ft: 1,
  in: 1 / 12,
  cm: 1 / 30.48,
  m: 3.28084,
};

export function bedGridDimensions(bed: GardenBed): { cols: number; rows: number } {
  const factor = UNIT_TO_FEET[bed.unit] ?? 1;
  return {
    cols: Math.ceil(bed.width * factor),
    rows: Math.ceil(bed.length * factor),
  };
}
