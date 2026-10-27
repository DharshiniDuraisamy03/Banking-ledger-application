import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import { TransactionPaginationInput } from '../schemas/transaction.schema.js';

export class TransactionController {
  public createTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = transactionService.createTransaction(id, req.body);
      res.status(201).json({
        status: 'success',
        message: `${result.transaction.type.toUpperCase()} transaction of ${result.transaction.amount} executed successfully`,
        data: {
          transaction: result.transaction,
          newBalance: result.newBalance,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const paginationParams = ((req as any).validatedQuery || req.query) as TransactionPaginationInput;
      const result = transactionService.getTransactionsByAccount(id, paginationParams);
      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const transactionController = new TransactionController();
