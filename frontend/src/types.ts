export type TransactionType = 'credit' | 'debit';
export type CurrencyCode = 'INR' | 'USD';

export interface Account {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  reference_id: string;
  description: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  reference_id: string;
  description: string | null;
  created_at: string;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface BalanceDetails {
  accountId: string;
  accountName: string;
  balance: number;
  ledgerBalance: number;
  isConsistent: boolean;
  lastUpdated: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
