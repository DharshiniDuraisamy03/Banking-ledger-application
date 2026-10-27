# 📋 System Assumptions & Architectural Decisions

This document details the architectural decisions, trade-offs, and domain assumptions made during the design and implementation of the **Banking Ledger & Transfer System**.

---

## 1. Data Integrity & Balance Consistency

### A. Balance Calculation & Reconciliation
- **Requirement**: *"The account balance must always represent the result of all valid transactions for that account."*
- **Implementation Decision**:
  - The `accounts` table caches the current balance to enable fast, constant-time `O(1)` balance lookups.
  - An endpoint (`GET /api/accounts/:id/balance`) computes $\sum(\text{credits}) - \sum(\text{debits})$ directly from the `transactions` ledger to continuously verify balance integrity (`isConsistent: true`).
  - To prevent floating-point rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), all balances and amounts are stored using the SQLite `NUMERIC` affinity and rounded to **2 decimal places** (`toFixed(2)`) at the service layer.

### B. Database-Level Overdraft Protection
- **Decision**: In addition to application-level checks, a hard database constraint `CHECK (balance >= 0)` is applied to `accounts.balance`.
- **Rationale**: If two concurrent debit requests arrive simultaneously, even if both pass the application-level `balance >= amount` check before either commits, the second database write will violate `CHECK (balance >= 0)` and abort, preventing negative balance anomalies at the database engine level.

---

## 2. Transaction Immutability

### A. Append-Only Ledger
- **Requirement**: *"Once a transaction is created, it must not be editable or deletable through the API."*
- **Implementation Decision**:
  - The API exposes **only `POST` and `GET`** endpoints for transactions.
  - There are **no `PUT`, `PATCH`, or `DELETE`** routes in the router.
  - The repository layer exposes only `create` and `find` methods, with no update or delete primitives.
  - Referential integrity is protected with `ON DELETE RESTRICT`, preventing an account from being deleted while transactions reference it.

---

## 3. Atomicity & Concurrency Strategy

### A. SQLite WAL Mode
- The database is configured with:
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  ```
- **Rationale**: Write-Ahead Logging (WAL) allows concurrent readers without blocking writers, while writers execute sequentially and atomically. The 5000ms busy timeout allows short concurrent transaction bursts to retry gracefully without raising immediate `SQLITE_BUSY` errors.

### B. Transaction Boundary
- In `better-sqlite3`, `db.transaction(fn)` executes `BEGIN IMMEDIATE TRANSACTION` and issues `COMMIT` upon clean return, or `ROLLBACK` if an exception occurs.
- Both the debit/credit transaction record and the account balance update take place within this single atomic block.

---

## 4. Idempotency & Reference ID Scoping

### A. Per-Account Idempotency
- **Requirement**: *"Duplicate reference_id for the same account must be handled correctly."*
- **Implementation Decision**:
  - A composite constraint `UNIQUE (account_id, reference_id)` is defined on the `transactions` table.
  - Different accounts may use the same reference ID (e.g., standard billing references), but an individual account cannot have duplicate reference IDs.
  - A duplicate attempt immediately triggers HTTP `409 Conflict` with error code `DUPLICATE_REFERENCE_ID`.

### B. Global Transfer Idempotency
- For cross-account transfers (`POST /api/transfers`), the transfer `reference_id` must be globally unique to guarantee that payment network retry requests do not duplicate a transfer.

---

## 5. Account Opening & Initial Deposit

### A. Opening Balance Ledger Representation
- **Decision**: When creating an account with an `initial_balance > 0`, the system automatically inserts an initial `credit` transaction into the ledger (`reference_id: INIT-<ACCOUNT_PREFIX>`).
- **Rationale**: This guarantees that from the moment an account is opened, its balance strictly equals the sum of its ledger transactions ($\sum\text{credits} - \sum\text{debits} = \text{balance}$), satisfying the prompt's balance consistency principle.

---

## 6. Money Transfer (Bonus Feature)

### A. Dual Ledger Entries
- An atomic transfer between Account A and Account B is recorded as:
  1. A `debit` transaction on the source account (`reference_id: <REF>-DEBIT`).
  2. A `credit` transaction on the destination account (`reference_id: <REF>-CREDIT`).
  3. A record in the `transfers` table tying both accounts together.
- This maintains complete double-entry bookkeeping transparency for both account holders.

### B. Self-Transfer Prevention
- A database-level constraint `CHECK (source_account_id != destination_account_id)` and a Zod schema validation reject transfers where source and destination are identical with HTTP `400 Bad Request`.

---

## 7. Pagination & Sorting Assumptions

### A. Pagination Defaults & Boundaries
- `page`: Defaults to `1`. Must be an integer $\ge 1$.
- `limit`: Defaults to `10`. Must be an integer between `1` and `100`.
- The response metadata includes:
  - `currentPage`: Current 1-based page index.
  - `pageSize`: Maximum records per page.
  - `totalRecords`: Count of total matching transaction records.
  - `totalPages`: Calculated as $\lceil\text{totalRecords} / \text{limit}\rceil$ (minimum `1`).

### B. Sorting Order
- Strictly ordered **latest-first** (`created_at DESC`).
- Indexed via `CREATE INDEX idx_transactions_account_created ON transactions(account_id, created_at DESC)` for high-throughput query execution.
