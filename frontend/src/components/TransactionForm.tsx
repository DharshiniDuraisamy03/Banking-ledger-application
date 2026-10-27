import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { createTransaction, getApiErrorMessage } from '../api.js';
import { Account, CurrencyCode, TransactionType } from '../types.js';
import { formatCurrency } from '../utils/formatters.js';

interface TransactionFormProps {
  account: Account;
  currency: CurrencyCode;
  onTransactionSuccess: (newBalance: number, msg: string) => void;
  onErrorToast: (msg: string) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  account,
  currency,
  onTransactionSuccess,
  onErrorToast,
}) => {
  const [type, setType] = useState<TransactionType>('credit');
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReferenceId = (txType: TransactionType) => {
    const prefix = txType === 'credit' ? 'CR' : 'DR';
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${Date.now().toString().slice(-4)}-${rand}`;
  };

  useEffect(() => {
    setReferenceId(generateReferenceId(type));
    setError(null);
  }, [type, account.id]);

  const parsedAmount = parseFloat(amount) || 0;
  const simulatedNewBalance =
    type === 'credit'
      ? account.balance + parsedAmount
      : account.balance - parsedAmount;

  const isOverdraft = type === 'debit' && parsedAmount > account.balance;

  const handleQuickAmount = (val: number, intendedType?: TransactionType) => {
    if (intendedType) setType(intendedType);
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (type === 'debit' && account.balance < parsedAmount) {
      const errTxt = `Insufficient balance. Available: ${formatCurrency(account.balance, currency)}, Requested: ${formatCurrency(parsedAmount, currency)}`;
      setError(errTxt);
      onErrorToast(errTxt);
      return;
    }

    if (!referenceId.trim()) {
      setError('reference_id is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await createTransaction(account.id, {
        type,
        amount: parsedAmount,
        reference_id: referenceId.trim(),
        description: description.trim() || undefined,
      });

      const successMsg = `${type.toUpperCase()} of ${formatCurrency(parsedAmount, currency)} successfully posted! Balance: ${formatCurrency(res.newBalance, currency)}`;
      setAmount('');
      setDescription('');
      setReferenceId(generateReferenceId(type));
      onTransactionSuccess(res.newBalance, successMsg);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      onErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-7 relative overflow-hidden">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Transact Funds
            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
              Instant
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic ledger mutation for <strong className="text-slate-700">{account.name}</strong>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="leading-relaxed font-medium">{error}</span>
        </div>
      )}

      {/* Credit / Debit Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl mb-5">
        <button
          type="button"
          onClick={() => setType('credit')}
          className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            type === 'credit'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Credit (Deposit)
        </button>
        <button
          type="button"
          onClick={() => setType('debit')}
          className={`py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            type === 'debit'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Debit (Withdrawal)
        </button>
      </div>

      {/* Quick Scenario Test Chips */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Assessment Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAmount(100, 'credit')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            +100 (Credit)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAmount(50, 'credit')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            +50 (Credit)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAmount(30, 'debit')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            -30 (Debit)
          </button>
          <button
            type="button"
            onClick={() => handleQuickAmount(20, 'debit')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            -20 (Debit)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Amount ({currency}) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              {currency === 'INR' ? '₹' : '$'}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-sm shadow-2xs"
            />
          </div>

          {/* Realtime Projected Balance Preview */}
          {parsedAmount > 0 && (
            <div className={`mt-2 p-2.5 rounded-xl text-xs flex justify-between items-center ${
              isOverdraft
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}>
              <span>Projected Balance:</span>
              <span className={`font-bold font-mono ${isOverdraft ? 'text-rose-600' : 'text-slate-900'}`}>
                {isOverdraft ? 'INSUFFICIENT FUNDS' : formatCurrency(simulatedNewBalance, currency)}
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Reference ID (Idempotency Key) <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setReferenceId(generateReferenceId(type))}
              className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          <input
            type="text"
            required
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Salary, Rent, Dinner"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading || isOverdraft}
          className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
            type === 'credit'
              ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 shadow-rose-600/20'
          }`}
        >
          {loading ? (
            'Committing to Ledger...'
          ) : type === 'credit' ? (
            <>
              <ArrowDownLeft className="w-4 h-4" /> Deposit {parsedAmount > 0 ? formatCurrency(parsedAmount, currency) : ''}
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" /> Withdraw {parsedAmount > 0 ? formatCurrency(parsedAmount, currency) : ''}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
