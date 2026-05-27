import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().max(150, 'Max 150 characters'),
  lastName: z.string().max(150, 'Max 150 characters'),
  email: z.string().email('Invalid email address'),
  timezone: z.string().min(1, 'Timezone is required'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
