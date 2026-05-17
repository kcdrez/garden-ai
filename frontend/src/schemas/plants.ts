import { z } from 'zod';

export const userPlantSchema = z.object({
  plant: z.string().min(1, 'Plant is required'),
  variety: z.string().optional(),
  plantedDate: z.string().optional(),
  status: z.enum(["planned", "planted", "growing", "harvested", "removed"]),
  notes: z.string().optional(),
});

export type UserPlantFormValues = z.infer<typeof userPlantSchema>;
