import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAccounts,
  fetchAccountBalance,
  fetchTransactions,
  getApiErrorMessage,
} from './api.js';
import {
  Account,
  BalanceDetails,
  CurrencyCode,
  PaginatedResult,
  ToastMessage,
  Transaction,
} from './types.js';
import { Navbar } from './components/Navbar.js';
import { AccountList } from './components/AccountList.js';
import { VirtualBankCard } from './components/VirtualBankCard.js';
import { TransactionForm } from './components/TransactionForm.js';
import { TransactionHistory } from './components/TransactionHistory.js';
import { CreateAccountModal } from './components/CreateAccountModal.js';
import { TransferModal } from './components/TransferModal.js';
import { TransactionReceiptModal } from './components/TransactionReceiptModal.js';
import { ToastContainer } from './components/Toast.js';
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from './utils/formatters.js';

export const App: React.FC = () => {
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [balanceDetails, setBalanceDetails] = useState<BalanceDetails | null>(null);
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<Transaction> | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals & Popups
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch accounts list
  const loadAccounts = useCallback(async (preferredId?: string) => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
      if (data.length > 0) {
        if (preferredId && data.some((a) => a.id === preferredId)) {
          setSelectedAccountId(preferredId);
        } else if (!selectedAccountId || !data.some((a) => a.id === selectedAccountId)) {
          setSelectedAccountId(data[0].id);
        }
      } else {
        setSelectedAccountId(null);
      }
    } catch (err) {
      addToast('error', 'Network Error', getApiErrorMessage(err));
    }
  }, [selectedAccountId]);

  // Load account balance and transactions
  const loadAccountDetails = useCallback(
    async (accId: string, targetPage = page, targetLimit = limit) => {
      try {
        setLoading(true);
        const [balanceRes, txRes] = await Promise.all([
          fetchAccountBalance(accId),
          fetchTransactions(accId, targetPage, targetLimit),
        ]);
        setBalanceDetails(balanceRes);
        setPaginatedData(txRes);
      } catch (err) {
        addToast('error', 'Fetch Failed', getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountDetails(selectedAccountId, page, limit);
    } else {
      setBalanceDetails(null);
      setPaginatedData(null);
    }
  }, [selectedAccountId, page, limit, loadAccountDetails]);

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setPage(1);
  };

  const handleTransactionSuccess = (_newBalance: number, msg: string) => {
    addToast('success', 'Transaction Settled', msg);
    loadAccounts(selectedAccountId || undefined);
    if (selectedAccountId) {
      loadAccountDetails(selectedAccountId, 1, limit);
      setPage(1);
    }
  };

  const handleTransferSuccess = (msg: string) => {
    addToast('success', 'Transfer Completed', msg);
    loadAccounts(selectedAccountId || undefined);
    if (selectedAccountId) {
      loadAccountDetails(selectedAccountId, 1, limit);
      setPage(1);
    }
  };

  const handleAccountCreated = (newAccount: Account) => {
    addToast('success', 'Account Opened', `Account '${newAccount.name}' created with balance ${formatCurrency(newAccount.balance, currency)}`);
    loadAccounts(newAccount.id);
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const totalLiquidity = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Queue */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Modern Navigation Header */}
      <Navbar
        currency={currency}
        onToggleCurrency={() => setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'))}
        onOpenCreateAccount={() => setIsCreateAccountOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/60 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                System Accounts
              </span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{accounts.length}</span>
              <span className="text-xs text-slate-400">active ledger wallets</span>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/60 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total System Vault
              </span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {formatCurrency(totalLiquidity, currency)}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Reconciled
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/60 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Wallet
              </span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-white font-mono">
                  {selectedAccount ? formatCurrency(selectedAccount.balance, currency) : formatCurrency(0, currency)}
                </span>
                <p className="text-xs text-slate-400 truncate max-w-[140px]">
                  {selectedAccount ? selectedAccount.name : 'No selection'}
                </p>
              </div>
              {balanceDetails?.isConsistent && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Ledger OK
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/60 shadow-lg shadow-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Integrity Engine
              </span>
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-white block">ACID Guaranteed</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atomic transactions, zero overdraft & idempotency keys
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Left Column (5 Cols): Virtual Card + Accounts List + Transact Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Interactive Virtual Bank Card */}
            {selectedAccount && (
              <VirtualBankCard
                account={selectedAccount}
                currency={currency}
                onCopyAccountId={(id) => {
                  navigator.clipboard.writeText(id);
                  addToast('info', 'Copied to Clipboard', `Account UUID: ${id}`);
                }}
              />
            )}

            {/* Transact Funds Form */}
            {selectedAccount && (
              <TransactionForm
                account={selectedAccount}
                currency={currency}
                onTransactionSuccess={handleTransactionSuccess}
                onErrorToast={(msg) => addToast('error', 'Transaction Rejected', msg)}
              />
            )}

            {/* Account List */}
            <AccountList
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              balanceDetails={balanceDetails}
              currency={currency}
              onSelectAccount={handleSelectAccount}
              onOpenCreateAccount={() => setIsCreateAccountOpen(true)}
            />
          </div>

          {/* Right Column (7 Cols): Ledger Statement with interactive filters */}
          <div className="lg:col-span-7">
            {selectedAccount ? (
              <TransactionHistory
                paginatedData={paginatedData}
                loading={loading}
                currency={currency}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                onSelectTransactionForReceipt={(tx) => setSelectedTxForReceipt(tx)}
              />
            ) : (
              <div className="bg-slate-800/80 rounded-3xl border border-slate-700/60 p-16 text-center shadow-lg">
                <Landmark className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white">No Account Selected</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Select an account from the left or open a new account to inspect live transaction statements.
                </p>
                <button
                  onClick={() => setIsCreateAccountOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Open First Account
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        currency={currency}
        onClose={() => setIsCreateAccountOpen(false)}
        onAccountCreated={handleAccountCreated}
        onErrorToast={(msg) => addToast('error', 'Creation Error', msg)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        currency={currency}
        onClose={() => setIsTransferOpen(false)}
        onTransferSuccess={handleTransferSuccess}
        onErrorToast={(msg) => addToast('error', 'Transfer Failed', msg)}
      />

      <TransactionReceiptModal
        transaction={selectedTxForReceipt}
        accountName={selectedAccount?.name}
        currency={currency}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
};
