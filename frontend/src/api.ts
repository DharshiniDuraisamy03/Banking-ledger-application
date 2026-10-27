import axios, { AxiosError } from 'axios';
import {
  Account,
  BalanceDetails,
  PaginatedResult,
  Transaction,
  Transfer,
} from './types.js';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      if (Array.isArray(data.details)) {
        return `${data.message}: ${data.details.map((d: any) => `${d.path} (${d.message})`).join(', ')}`;
      }
      return data.message;
    }
    return error.message || 'An unexpected network error occurred';
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

// Accounts
export const fetchAccounts = async (): Promise<Account[]> => {
  const res = await api.get('/accounts');
  return res.data.data;
};

export const createAccount = async (name: string, initial_balance?: number): Promise<Account> => {
  const res = await api.post('/accounts', { name, initial_balance });
  return res.data.data;
};

export const fetchAccountBalance = async (accountId: string): Promise<BalanceDetails> => {
  const res = await api.get(`/accounts/${accountId}/balance`);
  return res.data.data;
};

// Transactions
export const createTransaction = async (
  accountId: string,
  data: {
    type: 'credit' | 'debit';
    amount: number;
    reference_id: string;
    description?: string;
  }
): Promise<{ transaction: Transaction; newBalance: number }> => {
  const res = await api.post(`/accounts/${accountId}/transactions`, data);
  return res.data.data;
};

export const fetchTransactions = async (
  accountId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResult<Transaction>> => {
  const res = await api.get(`/accounts/${accountId}/transactions`, {
    params: { page, limit },
  });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

// Transfers (Bonus)
export const createTransfer = async (data: {
  source_account_id: string;
  destination_account_id: string;
  amount: number;
  reference_id: string;
  description?: string;
}): Promise<any> => {
  const res = await api.post('/transfers', data);
  return res.data.data;
};

export const fetchTransfers = async (): Promise<Transfer[]> => {
  const res = await api.get('/transfers');
  return res.data.data;
};
