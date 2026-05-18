import { z } from 'zod';

const posInt = z
  .string()
  .min(1, 'Required')
  .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) >= 1, 'Must be at least 1');

const optPosInt = z
  .string()
  .refine((v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) >= 1), 'Must be at least 1');

const optSunlight = z
  .string()
  .refine(
    (v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) <= 24),
    'Must be 0–24',
  );

export const bedSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  length: posInt,
  width: posInt,
  depth: optPosInt,
  unit: z.enum(['in', 'ft', 'cm', 'm']),
  facing: z.enum(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).optional(),
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
  unit: z.enum(['in', 'ft', 'cm', 'm']),
});

export type QuickBedFormValues = z.infer<typeof quickBedSchema>;
