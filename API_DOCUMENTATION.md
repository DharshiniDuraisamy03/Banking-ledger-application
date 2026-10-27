# 📖 Apex Bank API Documentation

**Base URL**: `http://localhost:5000`

All endpoints consume and produce `application/json`.

---

## 📑 Table of Contents
1. [Standard Response & Error Format](#standard-response--error-format)
2. [Accounts API](#accounts-api)
   - [Create Account](#1-create-account)
   - [List Accounts](#2-list-accounts)
   - [Get Account Details](#3-get-account-details)
   - [Get Account Balance & Reconciliation](#4-get-account-balance--reconciliation)
3. [Transactions API](#transactions-api)
   - [Create Transaction (Credit / Debit)](#5-create-transaction)
   - [List Paginated Transactions](#6-list-paginated-transactions)
4. [Money Transfer API (Bonus)](#money-transfer-api-bonus)
   - [Execute Transfer](#7-execute-transfer)
   - [List Transfers](#8-list-transfers)
5. [HTTP Status Codes Reference](#http-status-codes-reference)

---

## Standard Response & Error Format

### Success Response Envelope
```json
{
  "status": "success",
  "data": { ... }
}
```

### Standard Error Response Envelope
```json
{
  "status": "error",
  "statusCode": 400,
  "error": "INSUFFICIENT_BALANCE",
  "message": "Insufficient funds. Current balance is 100, requested debit amount is 150",
  "timestamp": "2026-10-27T04:22:15.123Z"
}
```

When input validation fails:
```json
{
  "status": "error",
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data provided",
  "details": [
    {
      "path": "name",
      "message": "Account name must not be empty"
    }
  ],
  "timestamp": "2026-10-27T04:22:15.123Z"
}
```

---

## Accounts API

### 1. Create Account
Registers a new account. If `initial_balance` is greater than 0, an initial credit transaction is atomically written to the ledger.

- **Method**: `POST`
- **Path**: `/api/accounts`
- **Request Body**:
```json
{
  "name": "Alice Johnson",
  "initial_balance": 100.00
}
```

- **Success Response** (`201 Created`):
```json
{
  "status": "success",
  "data": {
    "id": "c8ba8829-b893-4243-98e6-331fe03c7697",
    "name": "Alice Johnson",
    "balance": 100,
    "created_at": "2026-10-27T04:15:30.123Z",
    "updated_at": "2026-10-27T04:15:30.123Z"
  }
}
```

- **Example curl**:
```bash
curl -X POST http://localhost:5000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "initial_balance": 100}'
```

---

### 2. List Accounts
Retrieves all accounts ordered by creation date descending.

- **Method**: `GET`
- **Path**: `/api/accounts`

- **Success Response** (`200 OK`):
```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "name": "Alice Johnson",
      "balance": 100,
      "created_at": "2026-10-27T04:15:30.123Z",
      "updated_at": "2026-10-27T04:15:30.123Z"
    }
  ]
}
```

- **Example curl**:
```bash
curl http://localhost:5000/api/accounts
```

---

### 3. Get Account Details
Retrieves details for a specific account.

- **Method**: `GET`
- **Path**: `/api/accounts/:id`
- **Path Parameters**: `id` (UUID)

- **Success Response** (`200 OK`):
```json
{
  "status": "success",
  "data": {
    "id": "c8ba8829-b893-4243-98e6-331fe03c7697",
    "name": "Alice Johnson",
    "balance": 100,
    "created_at": "2026-10-27T04:15:30.123Z",
    "updated_at": "2026-10-27T04:15:30.123Z"
  }
}
```

- **Error Response** (`404 Not Found`):
```json
{
  "status": "error",
  "statusCode": 404,
  "error": "ACCOUNT_NOT_FOUND",
  "message": "Account with ID 'c8ba8829-b893-4243-98e6-331fe03c7697' not found",
  "timestamp": "2026-10-27T04:15:30.123Z"
}
```

- **Example curl**:
```bash
curl http://localhost:5000/api/accounts/c8ba8829-b893-4243-98e6-331fe03c7697
```

---

### 4. Get Account Balance & Reconciliation
Retrieves current balance and performs mathematical verification against $\sum\text{credits} - \sum\text{debits}$.

- **Method**: `GET`
- **Path**: `/api/accounts/:id/balance`

- **Success Response** (`200 OK`):
```json
{
  "status": "success",
  "data": {
    "accountId": "c8ba8829-b893-4243-98e6-331fe03c7697",
    "accountName": "Alice Johnson",
    "balance": 100,
    "ledgerBalance": 100,
    "isConsistent": true,
    "lastUpdated": "2026-10-27T04:15:30.123Z"
  }
}
```

---

## Transactions API

### 5. Create Transaction
Atomically adds a `credit` or `debit` entry to the account's immutable ledger and updates the account balance.

- **Method**: `POST`
- **Path**: `/api/accounts/:id/transactions`
- **Path Parameters**: `id` (Account UUID)
- **Request Body**:
```json
{
  "type": "credit",
  "amount": 50.00,
  "reference_id": "DEP-2026-101",
  "description": "Salary deposit"
}
```

- **Validation Rules**:
  - `type`: Must be `"credit"` or `"debit"`.
  - `amount`: Must be greater than 0.
  - `reference_id`: Required non-empty string. Must be unique per account.
  - `debit` checks: Source account balance must be $\ge$ amount.

- **Success Response** (`201 Created`):
```json
{
  "status": "success",
  "message": "CREDIT transaction of 50 executed successfully",
  "data": {
    "transaction": {
      "id": "97210e53-cf07-42c2-b36c-9a4f66a3ef89",
      "account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "type": "credit",
      "amount": 50,
      "reference_id": "DEP-2026-101",
      "description": "Salary deposit",
      "created_at": "2026-10-27T04:20:10.000Z"
    },
    "newBalance": 150
  }
}
```

- **Error: Insufficient Balance** (`400 Bad Request`):
```json
{
  "status": "error",
  "statusCode": 400,
  "error": "INSUFFICIENT_BALANCE",
  "message": "Insufficient funds. Current balance is 100, requested debit amount is 150",
  "timestamp": "2026-10-27T04:20:10.000Z"
}
```

- **Error: Duplicate Reference ID** (`409 Conflict`):
```json
{
  "status": "error",
  "statusCode": 409,
  "error": "DUPLICATE_REFERENCE_ID",
  "message": "Transaction with reference_id 'DEP-2026-101' already exists for account 'c8ba8829-b893-4243-98e6-331fe03c7697'",
  "timestamp": "2026-10-27T04:20:10.000Z"
}
```

- **Example curl**:
```bash
curl -X POST http://localhost:5000/api/accounts/c8ba8829-b893-4243-98e6-331fe03c7697/transactions \
  -H "Content-Type: application/json" \
  -d '{"type": "credit", "amount": 50, "reference_id": "DEP-2026-101", "description": "Consulting payment"}'
```

---

### 6. List Paginated Transactions
Retrieves paginated transactions for an account strictly in **latest-first order** based on `created_at DESC`.

- **Method**: `GET`
- **Path**: `/api/accounts/:id/transactions`
- **Query Parameters**:
  - `page` (optional integer, min 1, default `1`)
  - `limit` (optional integer, min 1, max 100, default `10`)

- **Success Response** (`200 OK`):
```json
{
  "status": "success",
  "data": [
    {
      "id": "97210e53-cf07-42c2-b36c-9a4f66a3ef89",
      "account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "type": "credit",
      "amount": 50,
      "reference_id": "DEP-2026-101",
      "description": "Salary deposit",
      "created_at": "2026-10-27T04:20:10.000Z"
    },
    {
      "id": "31b14a90-84c6-48ec-b1c4-2fbf8193f254",
      "account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "type": "credit",
      "amount": 100,
      "reference_id": "INIT-C8BA8829",
      "description": "Initial deposit upon account opening",
      "created_at": "2026-10-27T04:15:30.123Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 2,
    "totalRecords": 2,
    "totalPages": 1
  }
}
```

- **Example curl**:
```bash
curl "http://localhost:5000/api/accounts/c8ba8829-b893-4243-98e6-331fe03c7697/transactions?page=1&limit=10"
```

---

## Money Transfer API (Bonus)

### 7. Execute Transfer
Transfers funds between two distinct accounts in a single atomic database transaction.

- **Method**: `POST`
- **Path**: `/api/transfers`
- **Request Body**:
```json
{
  "source_account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
  "destination_account_id": "fa291b8a-1150-4241-9492-95f3b7ac8129",
  "amount": 30.00,
  "reference_id": "TRF-9021",
  "description": "Split bill reimbursement"
}
```

- **Validation Rules**:
  - `source_account_id` and `destination_account_id` must be valid UUIDs and must not be identical.
  - `amount > 0`.
  - `reference_id` must be provided and globally unique.
  - Source account must possess sufficient balance.

- **Success Response** (`201 Created`):
```json
{
  "status": "success",
  "message": "Transfer of $30 from 'Alice' to 'Bob' completed successfully",
  "data": {
    "transfer": {
      "id": "341c59bb-7124-4f80-9286-da22ef681944",
      "source_account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "destination_account_id": "fa291b8a-1150-4241-9492-95f3b7ac8129",
      "amount": 30,
      "reference_id": "TRF-9021",
      "description": "Split bill reimbursement",
      "created_at": "2026-10-27T04:25:00.000Z"
    },
    "sourceAccount": {
      "id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "name": "Alice",
      "previousBalance": 100,
      "newBalance": 70
    },
    "destinationAccount": {
      "id": "fa291b8a-1150-4241-9492-95f3b7ac8129",
      "name": "Bob",
      "previousBalance": 50,
      "newBalance": 80
    }
  }
}
```

- **Example curl**:
```bash
curl -X POST http://localhost:5000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "source_account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
    "destination_account_id": "fa291b8a-1150-4241-9492-95f3b7ac8129",
    "amount": 30,
    "reference_id": "TRF-9021",
    "description": "Lunch transfer"
  }'
```

---

### 8. List Transfers
Retrieves all recorded money transfers.

- **Method**: `GET`
- **Path**: `/api/transfers`

- **Success Response** (`200 OK`):
```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "id": "341c59bb-7124-4f80-9286-da22ef681944",
      "source_account_id": "c8ba8829-b893-4243-98e6-331fe03c7697",
      "destination_account_id": "fa291b8a-1150-4241-9492-95f3b7ac8129",
      "amount": 30,
      "reference_id": "TRF-9021",
      "description": "Split bill reimbursement",
      "created_at": "2026-10-27T04:25:00.000Z"
    }
  ]
}
```

---

## HTTP Status Codes Reference

| Status Code | Meaning | When Returned |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Successful `GET` queries (account, balance, transaction list, transfers). |
| **`201 Created`** | Created | Resource created (`POST /api/accounts`, `POST /api/.../transactions`, `POST /api/transfers`). |
| **`400 Bad Request`** | Validation / Business Rule Violation | Missing required fields, negative amount, insufficient balance for debit, self-transfer attempt. |
| **`404 Not Found`** | Resource Missing | Account or transfer not found. |
| **`409 Conflict`** | Duplicate Idempotency Key | Duplicate `reference_id` for an account transaction or transfer. |
| **`500 Internal Server Error`** | Server Fault | Unexpected internal errors or unhandled system exceptions. |
