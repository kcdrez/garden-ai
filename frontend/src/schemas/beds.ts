import { z } from 'zod';
import { posInt, optPosInt } from '@/lib/zod';
import { BED_UNITS, type BedUnit } from '@/types/gardens';

const bedUnitValues = BED_UNITS.map((u) => u.value) as [BedUnit, ...BedUnit[]];

const MAX_SUNLIGHT_HOURS = 24;
const optSunlight = z
  .string()
  .refine(
    (v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) <= MAX_SUNLIGHT_HOURS),
    `Must be 0–${MAX_SUNLIGHT_HOURS}`,
  );

export const bedSchema = z.object({
  gardenId: z.string().min(1, 'Garden is required'),
  name: z.string().min(1, 'Name is required'),
  length: posInt,
  width: posInt,
  depth: optPosInt,
  unit: z.enum(bedUnitValues),
  orientation: z.string(),
  avgSunlightHours: optSunlight,
  soilType: z.string(),
  notes: z.string(),
});

export type BedFormValues = z.infer<typeof bedSchema>;

export const quickBedSchema = z.object({
  gardenId: z.string().min(1, 'Garden is required'),
  name: z.string().min(1, 'Name is required'),
  length: posInt,
  width: posInt,
  unit: z.enum(bedUnitValues),
});

export type QuickBedFormValues = z.infer<typeof quickBedSchema>;
