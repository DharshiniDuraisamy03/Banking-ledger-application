import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { accountRepository } from '../repositories/account.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { transferRepository } from '../repositories/transfer.repository.js';
import { AppError, Transfer } from '../types/index.js';
import { CreateTransferInput } from '../schemas/transfer.schema.js';

export interface TransferResult {
  transfer: Transfer;
  sourceAccount: {
    id: string;
    name: string;
    previousBalance: number;
    newBalance: number;
  };
  destinationAccount: {
    id: string;
    name: string;
    previousBalance: number;
    newBalance: number;
  };
}

export class TransferService {
  public executeTransfer(input: CreateTransferInput): TransferResult {
    // 1. Validate self-transfer prevention
    if (input.source_account_id === input.destination_account_id) {
      throw new AppError(
        400,
        'SELF_TRANSFER_PROHIBITED',
        'Cannot transfer money to the same account (source and destination must be different)'
      );
    }

    // Wrap the entire transfer in an ACID transaction
    const runAtomicTransfer = db.transaction(() => {
      // 2. Validate transfer reference idempotency
      const existingTransfer = transferRepository.findByReference(input.reference_id);
      if (existingTransfer) {
        throw new AppError(
          409,
          'DUPLICATE_TRANSFER_REFERENCE',
          `Transfer with reference_id '${input.reference_id}' already exists`
        );
      }

      // 3. Verify existence of both accounts
      const sourceAccount = accountRepository.findById(input.source_account_id);
      if (!sourceAccount) {
        throw new AppError(
          404,
          'ACCOUNT_NOT_FOUND',
          `Source account with ID '${input.source_account_id}' does not exist`
        );
      }

      const destAccount = accountRepository.findById(input.destination_account_id);
      if (!destAccount) {
        throw new AppError(
          404,
          'ACCOUNT_NOT_FOUND',
          `Destination account with ID '${input.destination_account_id}' does not exist`
        );
      }

      // 4. Verify sufficient balance in source account
      const amount = Number(input.amount);
      if (sourceAccount.balance < amount) {
        throw new AppError(
          400,
          'INSUFFICIENT_BALANCE',
          `Source account has insufficient balance. Available: ${sourceAccount.balance}, Required: ${amount}`
        );
      }

      // 5. Compute new balances
      const newSourceBalance = Number((sourceAccount.balance - amount).toFixed(2));
      const newDestBalance = Number((destAccount.balance + amount).toFixed(2));

      // 6. Update balances
      accountRepository.updateBalance(sourceAccount.id, newSourceBalance);
      accountRepository.updateBalance(destAccount.id, newDestBalance);

      // 7. Create immutable ledger debit record on source account
      transactionRepository.create({
        id: uuidv4(),
        account_id: sourceAccount.id,
        type: 'debit',
        amount: amount,
        reference_id: `${input.reference_id}-DEBIT`,
        description: input.description || `Transfer to ${destAccount.name} (${destAccount.id})`,
      });

      // 8. Create immutable ledger credit record on destination account
      transactionRepository.create({
        id: uuidv4(),
        account_id: destAccount.id,
        type: 'credit',
        amount: amount,
        reference_id: `${input.reference_id}-CREDIT`,
        description: input.description || `Transfer from ${sourceAccount.name} (${sourceAccount.id})`,
      });

      // 9. Record the transfer entity
      const transfer = transferRepository.create({
        id: uuidv4(),
        source_account_id: sourceAccount.id,
        destination_account_id: destAccount.id,
        amount: amount,
        reference_id: input.reference_id,
        description: input.description || null,
      });

      return {
        transfer,
        sourceAccount: {
          id: sourceAccount.id,
          name: sourceAccount.name,
          previousBalance: sourceAccount.balance,
          newBalance: newSourceBalance,
        },
        destinationAccount: {
          id: destAccount.id,
          name: destAccount.name,
          previousBalance: destAccount.balance,
          newBalance: newDestBalance,
        },
      };
    });

    return runAtomicTransfer();
  }

  public getAllTransfers(): Transfer[] {
    return transferRepository.findAll();
  }

  public getTransferById(id: string): Transfer {
    const transfer = transferRepository.findById(id);
    if (!transfer) {
      throw new AppError(404, 'TRANSFER_NOT_FOUND', `Transfer with ID '${id}' not found`);
    }
    return transfer;
  }
}

export const transferService = new TransferService();
