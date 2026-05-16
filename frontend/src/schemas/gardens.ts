import { z } from 'zod';

export const gardenSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export type GardenFormValues = z.infer<typeof gardenSchema>;
