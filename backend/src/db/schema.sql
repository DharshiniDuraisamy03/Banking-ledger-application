-- ============================================================================
-- Banking Ledger System Schema
-- ============================================================================

-- 1. Accounts Table
-- Stores user accounts with balance constraint to guarantee balance consistency.
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 2. Transactions Table
-- Immutable ledger of all deposits (credit) and withdrawals (debit).
-- Composite UNIQUE (account_id, reference_id) guarantees idempotency.
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    reference_id TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CONSTRAINT uq_account_reference UNIQUE (account_id, reference_id)
);

-- Index for efficient latest-first paginated transaction listing
CREATE INDEX IF NOT EXISTS idx_transactions_account_created 
ON transactions(account_id, created_at DESC);

-- 3. Transfers Table (Bonus)
-- Tracks money transfers between two distinct accounts.
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    source_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    destination_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    reference_id TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (source_account_id != destination_account_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_source ON transfers(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_destination ON transfers(destination_account_id);
