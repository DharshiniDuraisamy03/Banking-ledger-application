import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Wifi, ShieldCheck } from 'lucide-react';
import { Account, CurrencyCode } from '../types.js';
import { formatCurrency, maskAccountId } from '../utils/formatters.js';

interface VirtualBankCardProps {
  account: Account | undefined;
  currency: CurrencyCode;
  onCopyAccountId: (id: string) => void;
}

export const VirtualBankCard: React.FC<VirtualBankCardProps> = ({
  account,
  currency,
  onCopyAccountId,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const handleCopy = () => {
    onCopyAccountId(account.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white shadow-2xl transition-all duration-300 hover:shadow-indigo-500/20 bg-gradient-to-tr from-slate-950 via-indigo-950 to-blue-900 border border-indigo-500/30">
      {/* Background ambient lighting effects */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      {/* Top Header of Card */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <span className="font-black text-sm tracking-widest text-indigo-200">APEX</span>
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Ledger Debit
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Wifi className="w-5 h-5 text-indigo-300/80 rotate-90" />
          <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3" /> ACID
          </span>
        </div>
      </div>

      {/* EMV Chip and Balance Preview */}
      <div className="relative z-10 flex justify-between items-end mb-6">
        {/* Realistic EMV Gold Chip */}
        <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-0.5 shadow-inner border border-amber-300/60 flex flex-col justify-between">
          <div className="h-full w-full rounded-xs border border-amber-600/40 grid grid-cols-2 gap-0.5 p-0.5 opacity-80">
            <div className="border border-amber-700/30 rounded-2xs"></div>
            <div className="border border-amber-700/30 rounded-2xs"></div>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end space-x-1.5 text-xs text-indigo-200/80 mb-0.5">
            <span>Available Balance</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="hover:text-white transition-colors cursor-pointer"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm font-mono">
            {showBalance ? formatCurrency(account.balance, currency) : '••••••••'}
          </div>
        </div>
      </div>

      {/* Card Number & Holder Details */}
      <div className="relative z-10 pt-2 border-t border-white/10 flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-2 text-indigo-200/80 font-mono text-xs tracking-wider mb-1">
            <span>{maskAccountId(account.id)}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 transition-colors text-slate-300 hover:text-white cursor-pointer"
              title="Copy Full UUID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-xs uppercase font-bold tracking-widest text-white/90">
            {account.name}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-indigo-300/70 block">Expires</span>
          <span className="text-xs font-mono font-semibold text-white/90">12/30</span>
        </div>
      </div>
    </div>
  );
};
