import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { accountRepository } from '../repositories/account.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { AppError, PaginatedResult, Transaction } from '../types/index.js';
import { CreateTransactionInput, TransactionPaginationInput } from '../schemas/transaction.schema.js';

export interface CreateTransactionResult {
  transaction: Transaction;
  newBalance: number;
}

export class TransactionService {
  public createTransaction(
    accountId: string,
    input: CreateTransactionInput
  ): CreateTransactionResult {
    // Wrap entire balance check, balance update, and ledger insert in an ACID transaction
    const executeAtomicTransaction = db.transaction(() => {
      // 1. Verify account existence
      const account = accountRepository.findById(accountId);
      if (!account) {
        throw new AppError(404, 'ACCOUNT_NOT_FOUND', `Account with ID '${accountId}' not found`);
      }

      // 2. Validate idempotency (duplicate reference_id for same account)
      const existingTx = transactionRepository.findByAccountAndReference(
        accountId,
        input.reference_id
      );
      if (existingTx) {
        throw new AppError(
          409,
          'DUPLICATE_REFERENCE_ID',
          `Transaction with reference_id '${input.reference_id}' already exists for account '${accountId}'`
        );
      }

      // 3. Compute new balance and check sufficient funds for debit
      let newBalance = account.balance;
      const amount = Number(input.amount);

      if (input.type === 'debit') {
        if (account.balance < amount) {
          throw new AppError(
            400,
            'INSUFFICIENT_BALANCE',
            `Insufficient funds. Current balance is ${account.balance}, requested debit amount is ${amount}`
          );
        }
        newBalance = Number((account.balance - amount).toFixed(2));
      } else if (input.type === 'credit') {
        newBalance = Number((account.balance + amount).toFixed(2));
      }

      // 4. Update account balance
      accountRepository.updateBalance(accountId, newBalance);

      // 5. Append transaction to immutable ledger
      const transaction = transactionRepository.create({
        id: uuidv4(),
        account_id: accountId,
        type: input.type,
        amount: amount,
        reference_id: input.reference_id,
        description: input.description || null,
      });

      return {
        transaction,
        newBalance,
      };
    });

    return executeAtomicTransaction();
  }

  public getTransactionsByAccount(
    accountId: string,
    pagination: TransactionPaginationInput
  ): PaginatedResult<Transaction> {
    // 1. Check account existence
    const account = accountRepository.findById(accountId);
    if (!account) {
      throw new AppError(404, 'ACCOUNT_NOT_FOUND', `Account with ID '${accountId}' not found`);
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const offset = (page - 1) * limit;

    const totalRecords = transactionRepository.countByAccountId(accountId);
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const data = transactionRepository.findByAccountIdPaginated(accountId, limit, offset);

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalRecords,
        totalPages,
      },
    };
  }
}

export const transactionService = new TransactionService();
