import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { accountRepository } from '../repositories/account.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { Account, AppError } from '../types/index.js';
import { CreateAccountInput } from '../schemas/account.schema.js';

export class AccountService {
  public createAccount(input: CreateAccountInput): Account {
    const accountId = uuidv4();
    const initialBalance = input.initial_balance || 0;

    // Execute atomically
    const runAtomicCreation = db.transaction(() => {
      const account = accountRepository.create({
        id: accountId,
        name: input.name,
        balance: initialBalance,
      });

      // If initial balance is provided, record it as a credit transaction in the ledger
      if (initialBalance > 0) {
        transactionRepository.create({
          id: uuidv4(),
          account_id: accountId,
          type: 'credit',
          amount: initialBalance,
          reference_id: `INIT-${accountId.slice(0, 8).toUpperCase()}`,
          description: 'Initial deposit upon account opening',
        });
      }

      return account;
    });

    return runAtomicCreation();
  }

  public getAccount(id: string): Account {
    const account = accountRepository.findById(id);
    if (!account) {
      throw new AppError(404, 'ACCOUNT_NOT_FOUND', `Account with ID '${id}' not found`);
    }
    return account;
  }

  public getAllAccounts(): Account[] {
    return accountRepository.findAll();
  }

  public getAccountBalance(id: string): { account: Account; ledgerBalance: number; isConsistent: boolean } {
    const account = this.getAccount(id);
    const ledgerBalance = transactionRepository.calculateLedgerBalance(id);
    return {
      account,
      ledgerBalance,
      isConsistent: Math.abs(account.balance - ledgerBalance) < 0.001,
    };
  }
}

export const accountService = new AccountService();
