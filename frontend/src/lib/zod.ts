import { z } from 'zod';

export const posInt = z
  .string()
  .min(1, 'Required')
  .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) >= 1, 'Must be at least 1');

export const optPosInt = z
  .string()
  .refine((v) => v === '' || (/^\d+$/.test(v) && parseInt(v, 10) >= 1), 'Must be at least 1');
