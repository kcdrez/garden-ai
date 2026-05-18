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
