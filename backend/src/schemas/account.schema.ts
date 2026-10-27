import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z
    .string({ message: 'Account name must be provided' })
    .trim()
    .min(1, 'Account name must not be empty')
    .max(100, 'Account name cannot exceed 100 characters'),
  initial_balance: z
    .number()
    .min(0, 'Initial balance cannot be negative')
    .optional()
    .default(0),
});

export const accountIdParamSchema = z.object({
  id: z.string().uuid('Invalid account ID format. Must be a valid UUID'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
