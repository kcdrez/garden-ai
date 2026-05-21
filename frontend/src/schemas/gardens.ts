import { z } from 'zod';
import { optPosInt } from '@/lib/zod';
import { BED_UNITS, type BedUnit } from '@/types/gardens';

const bedUnitValues = BED_UNITS.map((u) => u.value) as [BedUnit, ...BedUnit[]];

export const gardenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  length: optPosInt,
  width: optPosInt,
  unit: z.enum(bedUnitValues),
});

export type GardenFormValues = z.infer<typeof gardenSchema>;
