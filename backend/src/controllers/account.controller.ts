import { Request, Response, NextFunction } from 'express';
import { accountService } from '../services/account.service.js';

export class AccountController {
  public createAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const account = accountService.createAccount(req.body);
      res.status(201).json({
        status: 'success',
        data: account,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllAccounts = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const accounts = accountService.getAllAccounts();
      res.status(200).json({
        status: 'success',
        count: accounts.length,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAccountById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const account = accountService.getAccount(id);
      res.status(200).json({
        status: 'success',
        data: account,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAccountBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = accountService.getAccountBalance(id);
      res.status(200).json({
        status: 'success',
        data: {
          accountId: result.account.id,
          accountName: result.account.name,
          balance: result.account.balance,
          ledgerBalance: result.ledgerBalance,
          isConsistent: result.isConsistent,
          lastUpdated: result.account.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const accountController = new AccountController();
