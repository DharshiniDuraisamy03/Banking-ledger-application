import React from 'react';
import { Wallet, CheckCircle2, User, Plus } from 'lucide-react';
import { Account, BalanceDetails, CurrencyCode } from '../types.js';
import { formatCurrency, maskAccountId } from '../utils/formatters.js';

interface AccountListProps {
  accounts: Account[];
  selectedAccountId: string | null;
  balanceDetails: BalanceDetails | null;
  currency: CurrencyCode;
  onSelectAccount: (accountId: string) => void;
  onOpenCreateAccount: () => void;
}

export const AccountList: React.FC<AccountListProps> = ({
  accounts,
  selectedAccountId,
  balanceDetails,
  currency,
  onSelectAccount,
  onOpenCreateAccount,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Your Accounts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Switch active ledger context</p>
        </div>
        <button
          onClick={onOpenCreateAccount}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Open New
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="py-8 text-center">
          <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No accounts open yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {accounts.map((acc, index) => {
            const isSelected = acc.id === selectedAccountId;
            const avatarGradients = [
              'from-blue-600 to-indigo-600',
              'from-purple-600 to-pink-600',
              'from-emerald-600 to-teal-600',
              'from-amber-500 to-orange-600',
            ];
            const gradient = avatarGradients[index % avatarGradients.length];

            return (
              <div
                key={acc.id}
                onClick={() => onSelectAccount(acc.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs bg-gradient-to-tr ${gradient} shadow-xs`}
                  >
                    {acc.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {acc.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {maskAccountId(acc.id)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {formatCurrency(acc.balance, currency)}
                  </p>
                  {isSelected && balanceDetails && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Reconciled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
