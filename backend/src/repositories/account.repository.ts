import { db } from '../db/index.js';
import { Account } from '../types/index.js';

export class AccountRepository {
  public create(account: { id: string; name: string; balance: number }): Account {
    const stmt = db.prepare(`
      INSERT INTO accounts (id, name, balance)
      VALUES (?, ?, ?)
      RETURNING id, name, balance, created_at, updated_at
    `);
    return stmt.get(account.id, account.name, account.balance) as Account;
  }

  public findById(id: string): Account | null {
    const stmt = db.prepare(`
      SELECT id, name, balance, created_at, updated_at
      FROM accounts
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as Account) || null;
  }

  public findAll(): Account[] {
    const stmt = db.prepare(`
      SELECT id, name, balance, created_at, updated_at
      FROM accounts
      ORDER BY created_at DESC
    `);
    return stmt.all() as Account[];
  }

  public updateBalance(id: string, newBalance: number): void {
    const stmt = db.prepare(`
      UPDATE accounts
      SET balance = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `);
    stmt.run(newBalance, id);
  }
}

export const accountRepository = new AccountRepository();
