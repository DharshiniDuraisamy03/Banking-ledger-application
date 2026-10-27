import React, { useState } from 'react';
import { X, Check, Copy, ArrowDownLeft, ArrowUpRight, ShieldCheck, Printer, Calendar, Hash, FileText, User } from 'lucide-react';
import { CurrencyCode, Transaction } from '../types.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

interface TransactionReceiptModalProps {
  transaction: Transaction | null;
  accountName?: string;
  currency: CurrencyCode;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  accountName,
  currency,
  onClose,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!transaction) return null;

  const isCredit = transaction.type === 'credit';

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.reference_id);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Receipt Header Banner */}
        <div className={`p-6 text-white ${isCredit ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-pink-700'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Immutable Ledger Receipt
            </span>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center py-2">
            <div className="inline-flex p-3 rounded-2xl bg-white/15 backdrop-blur-md mb-2">
              {isCredit ? (
                <ArrowDownLeft className="w-8 h-8 text-white" />
              ) : (
                <ArrowUpRight className="w-8 h-8 text-white" />
              )}
            </div>
            <h4 className="text-sm font-medium text-white/90 uppercase tracking-widest">
              {isCredit ? 'Funds Deposited' : 'Funds Withdrawn'}
            </h4>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">
              {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
            </div>
          </div>
        </div>

        {/* Receipt Details Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" /> Reference ID
            </span>
            <div className="flex items-center space-x-1 font-mono text-xs font-semibold text-slate-800">
              <span>{transaction.reference_id}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy Reference ID"
              >
                {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Account Holder
            </span>
            <span className="font-semibold text-slate-800">{accountName || 'Apex Account'}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Settlement Time
            </span>
            <span className="text-xs text-slate-700 font-medium">
              {formatDate(transaction.created_at)}
            </span>
          </div>

          <div className="flex justify-between items-start py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Description
            </span>
            <span className="text-xs text-slate-800 text-right max-w-[200px] font-medium">
              {transaction.description || <span className="italic text-slate-400">Standard Ledger Entry</span>}
            </span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cryptographically sealed & persisted. Immutability guaranteed.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
