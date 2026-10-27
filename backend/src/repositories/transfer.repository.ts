import { db } from '../db/index.js';
import { Transfer } from '../types/index.js';

export class TransferRepository {
  public create(transfer: {
    id: string;
    source_account_id: string;
    destination_account_id: string;
    amount: number;
    reference_id: string;
    description: string | null;
  }): Transfer {
    const stmt = db.prepare(`
      INSERT INTO transfers (id, source_account_id, destination_account_id, amount, reference_id, description)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, source_account_id, destination_account_id, amount, reference_id, description, created_at
    `);
    return stmt.get(
      transfer.id,
      transfer.source_account_id,
      transfer.destination_account_id,
      transfer.amount,
      transfer.reference_id,
      transfer.description
    ) as Transfer;
  }

  public findByReference(referenceId: string): Transfer | null {
    const stmt = db.prepare(`
      SELECT id, source_account_id, destination_account_id, amount, reference_id, description, created_at
      FROM transfers
      WHERE reference_id = ?
    `);
    const row = stmt.get(referenceId);
    return (row as Transfer) || null;
  }

  public findById(id: string): Transfer | null {
    const stmt = db.prepare(`
      SELECT id, source_account_id, destination_account_id, amount, reference_id, description, created_at
      FROM transfers
      WHERE id = ?
    `);
    const row = stmt.get(id);
    return (row as Transfer) || null;
  }

  public findAll(): Transfer[] {
    const stmt = db.prepare(`
      SELECT id, source_account_id, destination_account_id, amount, reference_id, description, created_at
      FROM transfers
      ORDER BY created_at DESC
    `);
    return stmt.all() as Transfer[];
  }
}

export const transferRepository = new TransferRepository();
