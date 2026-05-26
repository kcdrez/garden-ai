import { z } from 'zod';
import { USER_PLANT_STATUSES, OBSERVATION_TYPES } from '@/types/plants';
import type { UserPlantStatus, ObservationType } from '@/types/plants';
import { posInt } from '@/lib/zod';

const statusValues = USER_PLANT_STATUSES.map(s => s.value) as [UserPlantStatus, ...UserPlantStatus[]];
const observationTypeValues = OBSERVATION_TYPES.map(t => t.value) as [ObservationType, ...ObservationType[]];

export const userPlantSchema = z.object({
  gardenId: z.string().min(1, 'Garden is required'),
  bedId: z.string().min(1, 'Bed is required'),
  plant: z.string().min(1, 'Plant is required'),
  variety: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(statusValues),
  notes: z.string().optional(),
  quantity: posInt.refine((v) => parseInt(v, 10) <= 50, 'Max 50'),
});

export type UserPlantFormValues = z.infer<typeof userPlantSchema>;

export const observationSchema = z.object({
  type: z.enum(observationTypeValues),
  observedDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
  newStatus: z.enum(statusValues),
}).superRefine((data, ctx) => {
  if (data.type === "status_change" && !data.newStatus?.trim()) {
    ctx.addIssue({ code: "custom", message: "Status is required", path: ["newStatus"] });
  }
  if (data.type !== "status_change" && !data.note?.trim()) {
    ctx.addIssue({ code: "custom", message: "Note is required", path: ["note"] });
  }
});

export type ObservationFormValues = z.infer<typeof observationSchema>;

export const observationEditSchema = z.object({
  observedDate: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
});

export type ObservationEditFormValues = z.infer<typeof observationEditSchema>;
