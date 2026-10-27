import { db } from '../db/index.js';
import { Transaction } from '../types/index.js';

export class TransactionRepository {
  public create(tx: {
    id: string;
    account_id: string;
    type: string;
    amount: number;
    reference_id: string;
    description: string | null;
  }): Transaction {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, account_id, type, amount, reference_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, account_id, type, amount, reference_id, description, created_at
    `);
    return stmt.get(
      tx.id,
      tx.account_id,
      tx.type,
      tx.amount,
      tx.reference_id,
      tx.description
    ) as Transaction;
  }

  public findByAccountAndReference(accountId: string, referenceId: string): Transaction | null {
    const stmt = db.prepare(`
      SELECT id, account_id, type, amount, reference_id, description, created_at
      FROM transactions
      WHERE account_id = ? AND reference_id = ?
    `);
    const row = stmt.get(accountId, referenceId);
    return (row as Transaction) || null;
  }

  public findByAccountIdPaginated(
    accountId: string,
    limit: number,
    offset: number
  ): Transaction[] {
    const stmt = db.prepare(`
      SELECT id, account_id, type, amount, reference_id, description, created_at
      FROM transactions
      WHERE account_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(accountId, limit, offset) as Transaction[];
  }

  public countByAccountId(accountId: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE account_id = ?
    `);
    const row = stmt.get(accountId) as { count: number };
    return row ? row.count : 0;
  }

  public calculateLedgerBalance(accountId: string): number {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(
        CASE 
          WHEN type = 'credit' THEN amount 
          WHEN type = 'debit' THEN -amount 
          ELSE 0 
        END
      ), 0) as balance
      FROM transactions
      WHERE account_id = ?
    `);
    const row = stmt.get(accountId) as { balance: number };
    return row ? Number(row.balance) : 0;
  }
}

export const transactionRepository = new TransactionRepository();
