import { z } from 'zod';
import { USER_PLANT_STATUSES, OBSERVATION_TYPES } from '@/types/plants';
import type { UserPlantStatus, ObservationType } from '@/types/plants';

const statusValues = USER_PLANT_STATUSES.map(s => s.value) as [UserPlantStatus, ...UserPlantStatus[]];
const observationTypeValues = OBSERVATION_TYPES.map(t => t.value) as [ObservationType, ...ObservationType[]];

export const userPlantSchema = z.object({
  plant: z.string().min(1, 'Plant is required'),
  variety: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(statusValues),
  notes: z.string().optional(),
});

export type UserPlantFormValues = z.infer<typeof userPlantSchema>;

export const observationSchema = z.object({
  type: z.enum(observationTypeValues),
  observedDate: z.string().min(1, "Date is required"),
  note: z.string().optional(),
  newStatus: z.enum(statusValues),
}).superRefine((data, ctx) => {
  if (data.type === "status_change" && !data.newStatus?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Status is required", path: ["newStatus"] });
  }
  if (data.type !== "status_change" && !data.note?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Note is required", path: ["note"] });
  }
});

export type ObservationFormValues = z.infer<typeof observationSchema>;
