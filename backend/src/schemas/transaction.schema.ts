import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['credit', 'debit'], {
    message: "Transaction type must be either 'credit' or 'debit'",
  }),
  amount: z
    .number({
      message: 'Amount must be a valid number',
    })
    .positive('Amount must be greater than 0'),
  reference_id: z
    .string({
      message: 'reference_id must be provided',
    })
    .trim()
    .min(1, 'reference_id cannot be empty')
    .max(100, 'reference_id cannot exceed 100 characters'),
  description: z.string().trim().max(255).optional(),
});

export const transactionPaginationSchema = z.object({
  page: z.coerce
    .number({
      message: 'Page must be a valid number',
    })
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number({
      message: 'Limit must be a valid number',
    })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransactionPaginationInput = z.infer<typeof transactionPaginationSchema>;
