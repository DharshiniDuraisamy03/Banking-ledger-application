import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { createTransfer, getApiErrorMessage } from '../api.js';
import { Account, CurrencyCode } from '../types.js';
import { formatCurrency } from '../utils/formatters.js';

interface TransferModalProps {
  isOpen: boolean;
  accounts: Account[];
  selectedAccountId: string | null;
  currency: CurrencyCode;
  onClose: () => void;
  onTransferSuccess: (msg: string) => void;
  onErrorToast: (msg: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  accounts,
  selectedAccountId,
  currency,
  onClose,
  onTransferSuccess,
  onErrorToast,
}) => {
  const [sourceId, setSourceId] = useState<string>('');
  const [destId, setDestId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReferenceId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRF-${Date.now().toString().slice(-4)}-${randomHex}`;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAmount('');
      setDescription('');
      setReferenceId(generateReferenceId());

      if (selectedAccountId && accounts.some((a) => a.id === selectedAccountId)) {
        setSourceId(selectedAccountId);
        const otherAccount = accounts.find((a) => a.id !== selectedAccountId);
        if (otherAccount) setDestId(otherAccount.id);
      } else if (accounts.length > 0) {
        setSourceId(accounts[0].id);
        if (accounts.length > 1) {
          setDestId(accounts[1].id);
        }
      }
    }
  }, [isOpen, selectedAccountId, accounts]);

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === sourceId);
  const destAccount = accounts.find((a) => a.id === destId);
  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      setError('Please select both source and destination accounts');
      return;
    }

    if (sourceId === destId) {
      setError('Source and destination accounts must be different');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (sourceAccount && sourceAccount.balance < parsedAmount) {
      const err = `Insufficient funds in ${sourceAccount.name}. Available: ${formatCurrency(sourceAccount.balance, currency)}, Required: ${formatCurrency(parsedAmount, currency)}`;
      setError(err);
      onErrorToast(err);
      return;
    }

    if (!referenceId.trim()) {
      setError('reference_id is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createTransfer({
        source_account_id: sourceId,
        destination_account_id: destId,
        amount: parsedAmount,
        reference_id: referenceId.trim(),
        description: description.trim() || undefined,
      });

      const successTxt = `Atomic transfer of ${formatCurrency(parsedAmount, currency)} from ${sourceAccount?.name} to ${destAccount?.name} completed!`;
      onTransferSuccess(successTxt);
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      onErrorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Transfer Money</h3>
              <p className="text-xs text-slate-500">Atomic dual-ledger settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                From (Source)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full py-1.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, currency)})
                  </option>
                ))}
              </select>
              {sourceAccount && (
                <p className="text-[11px] text-slate-600 mt-2 font-mono">
                  Available: <strong className="text-slate-900">{formatCurrency(sourceAccount.balance, currency)}</strong>
                </p>
              )}
            </div>

            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                To (Destination)
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full py-1.5 px-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === sourceId}>
                    {acc.name} ({formatCurrency(acc.balance, currency)}) {acc.id === sourceId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
              {destAccount && (
                <p className="text-[11px] text-slate-600 mt-2 font-mono">
                  Current: <strong className="text-slate-900">{formatCurrency(destAccount.balance, currency)}</strong>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transfer Amount ({currency}) <span className="text-rose-500">*</span>
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
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Reference ID (Idempotency Key) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setReferenceId(generateReferenceId())}
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
              Transfer Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Split rent, Lunch payment"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || accounts.length < 2}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Committing Transfer...' : 'Execute Atomic Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
