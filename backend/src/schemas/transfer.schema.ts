import { z } from 'zod';

export const createTransferSchema = z
  .object({
    source_account_id: z
      .string({ message: 'source_account_id must be provided' })
      .uuid('source_account_id must be a valid UUID'),
    destination_account_id: z
      .string({ message: 'destination_account_id must be provided' })
      .uuid('destination_account_id must be a valid UUID'),
    amount: z
      .number({ message: 'Amount must be a valid number' })
      .positive('Transfer amount must be greater than 0'),
    reference_id: z
      .string({ message: 'reference_id must be provided' })
      .trim()
      .min(1, 'reference_id cannot be empty')
      .max(100, 'reference_id cannot exceed 100 characters'),
    description: z.string().trim().max(255).optional(),
  })
  .refine((data) => data.source_account_id !== data.destination_account_id, {
    message: 'Cannot transfer money to the same account (source and destination must differ)',
    path: ['destination_account_id'],
  });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
