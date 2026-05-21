import { z } from 'zod';
import { posInt, optPosInt } from '@/lib/zod';
import { BED_UNITS, BED_FACINGS, type BedUnit, type BedFacing } from '@/types/gardens';

const bedUnitValues = BED_UNITS.map((u) => u.value) as [BedUnit, ...BedUnit[]];
const bedFacingValues = BED_FACINGS.map((f) => f.value) as [BedFacing, ...BedFacing[]];

const optSunlight = z
  .string()
  .refine(
    (v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) <= 24),
    'Must be 0–24',
  );

export const bedSchema = z.object({
  gardenId: z.string().min(1, 'Garden is required'),
  name: z.string().min(1, 'Name is required'),
  length: posInt,
  width: posInt,
  depth: optPosInt,
  unit: z.enum(bedUnitValues),
  facing: z.enum(bedFacingValues).optional(),
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
