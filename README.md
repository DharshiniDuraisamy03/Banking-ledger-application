# 🏦 Apex Bank - Full Stack Banking Ledger & Transfer Application

A production-grade, ACID-compliant banking ledger application built with **Node.js, Express, TypeScript, SQLite (`better-sqlite3`), and React (Vite + Tailwind CSS)**.

Designed for high data integrity, strict transaction immutability, mathematical balance consistency, and atomic cross-account transfers.

---

## 🌟 Key Features

### 1. Data Integrity & ACID Transactions
- **Atomicity**: Transaction creation and account balance updates are wrapped in an atomic database transaction. If any check or query fails, all changes are rolled back immediately.
- **Balance Consistency**: Account balance is mathematically guaranteed to equal $\sum(\text{credits}) - \sum(\text{debits})$.
- **Database-Level Guardrails**:
  - `CHECK (balance >= 0)` prevents overdrafts even under race conditions.
  - `CHECK (amount > 0)` prevents zero or negative transaction amounts.
  - `FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT` guarantees referential integrity.
- **Transaction Immutability**: The API is strictly append-only. There are **zero** `PUT`, `PATCH`, or `DELETE` endpoints for transactions.

### 2. Idempotency & Duplicate Prevention
- Unique constraint on `(account_id, reference_id)` prevents accidental double-charging or duplicate network retries.

### 3. Pagination & Latest-First Sorting
- `GET /api/accounts/:id/transactions?page=1&limit=10`
- Query parameters: `page` (default 1) and `limit` (default 10, max 100).
- Detailed metadata returned: `currentPage`, `pageSize`, `totalRecords`, `totalPages`.
- Ordered strictly **latest-first** based on `created_at DESC` (optimized with composite database index).

### 4. Comprehensive Validation & Consistent Error Handling
- Built with **Zod** schema validation.
- Standardized error format with appropriate HTTP status codes (`400 Bad Request`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`).

### 5. Bonus Feature: Atomic Money Transfer
- `POST /api/transfers` executes a 2-legged transfer between Account A and Account B:
  - Validates both accounts exist and prevents self-transfers (`source != destination`).
  - Checks sufficient balance on source account.
  - Atomically debits source account, credits destination account, and appends dual ledger entries (`-DEBIT` and `-CREDIT`).
  - Partial transfer is mathematically impossible.

### 6. Interactive Frontend Dashboard
- Responsive React dashboard to create accounts, perform real-time deposits and withdrawals, execute transfers, and browse paginated transactions with status badges.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ or v20+ or v22+)
- **npm** (v9+)

### Installation

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 💻 Running the Application

### Option A: Run Backend & Frontend Concurrently

1. **Start the Backend Server** (runs on `http://localhost:5000`):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Dev Server** (in a separate terminal, runs on `http://localhost:3000`):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser at **`http://localhost:3000`**.

---

## 🧪 Running Automated Tests

A comprehensive integration test suite verifies all assessment requirements (Atomicity, Balance Consistency, Overdraft Protection, Idempotency, Pagination, Latest-First Sorting, and Transfers):

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- ✅ Account creation with name validation and optional initial deposit.
- ✅ Exact assessment scenario: Credit 100, Credit 50, Debit 30, Debit 20 $\rightarrow$ Final Balance 100.
- ✅ Ledger sum verification ($\sum\text{credits} - \sum\text{debits} == \text{balance}$).
- ✅ Overdraft rejection (`400 INSUFFICIENT_BALANCE`) and rollback verification.
- ✅ Idempotency rejection (`409 DUPLICATE_REFERENCE_ID`).
- ✅ Foreign key constraint enforcement on non-existent account ID (`404 ACCOUNT_NOT_FOUND`).
- ✅ Pagination metadata validation (`currentPage`, `pageSize`, `totalRecords`, `totalPages`).
- ✅ Latest-first transaction ordering verification.
- ✅ Bonus: Transfer scenario (Account A: 100, Account B: 50, Transfer: 30 $\rightarrow$ A: 70, B: 80).
- ✅ Self-transfer rejection.
- ✅ Transfer overdraft rollback.

---

<img width="1920" height="1080" alt="Screenshot 2026-10-27 114251" src="https://github.com/user-attachments/assets/19571797-a206-48aa-9cdb-cd26ec170690" />


## 📁 Project Structure

```text
Bank App/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment and server config
│   │   ├── controllers/         # Express HTTP request controllers
│   │   │   ├── account.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   └── transfer.controller.ts
│   │   ├── db/                  # SQLite connection, WAL mode & schema DDL
│   │   │   ├── index.ts
│   │   │   └── schema.sql
│   │   ├── middleware/          # Central error handler & Zod validation
│   │   │   ├── errorHandler.ts
│   │   │   └── validate.ts
│   │   ├── repositories/        # Database query layers
│   │   │   ├── account.repository.ts
│   │   │   ├── transaction.repository.ts
│   │   │   └── transfer.repository.ts
│   │   ├── routes/              # Express API route declarations
│   │   │   ├── account.routes.ts
│   │   │   └── transfer.routes.ts
│   │   ├── schemas/             # Zod input validation schemas
│   │   │   ├── account.schema.ts
│   │   │   ├── transaction.schema.ts
│   │   │   └── transfer.schema.ts
│   │   ├── services/            # Core business logic & ACID transaction runner
│   │   │   ├── account.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   └── transfer.service.ts
│   │   ├── types/               # TypeScript interfaces & AppError class
│   │   ├── app.ts               # Express application configuration
│   │   ├── server.ts            # Server entry point
│   │   ├── test-api.ts          # Automated integration tests for accounts & transactions
│   │   └── test-transfers.ts    # Automated integration tests for money transfers
│   ├── .env                     # Local environment settings
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── AccountList.tsx
│   │   │   ├── CreateAccountModal.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   └── TransferModal.tsx
│   │   ├── api.ts               # Axios API client
│   │   ├── App.tsx              # Main dashboard view
│   │   ├── types.ts             # Client domain models
│   │   ├── index.css            # Tailwind CSS v4 styling
│   │   └── main.tsx             # React mount
│   ├── package.json
│   └── vite.config.ts           # Vite bundler & API reverse proxy configuration
│
├── API_DOCUMENTATION.md         # Detailed endpoint contracts, schemas & curl samples
├── ASSUMPTIONS.md               # Technical decisions, constraints & trade-offs
├── package.json                 # Monorepo root scripts
└── README.md                    # Project documentation
```
