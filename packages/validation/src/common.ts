import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const uuidSchema = z.string().uuid();

export const statusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);

export const emailSchema = z.string().email().toLowerCase();

export const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number');
