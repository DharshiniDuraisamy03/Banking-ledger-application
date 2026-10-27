import React from 'react';
import { Landmark, ArrowRightLeft, UserPlus, ShieldCheck, IndianRupee, DollarSign } from 'lucide-react';
import { CurrencyCode } from '../types.js';

interface NavbarProps {
  currency: CurrencyCode;
  onToggleCurrency: () => void;
  onOpenCreateAccount: () => void;
  onOpenTransfer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currency,
  onToggleCurrency,
  onOpenCreateAccount,
  onOpenTransfer,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Apex Ledger
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ACID LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Double-Entry Core Banking Engine
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Currency Switcher */}
            <button
              onClick={onToggleCurrency}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Toggle Currency"
            >
              {currency === 'INR' ? (
                <>
                  <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                  <span>INR (₹)</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>USD ($)</span>
                </>
              )}
            </button>

            {/* Transfer Money Button */}
            <button
              onClick={onOpenTransfer}
              className="inline-flex items-center px-3.5 py-1.5 border border-slate-700 text-xs font-semibold rounded-xl text-slate-200 bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Transfer
            </button>

            {/* New Account Button */}
            <button
              onClick={onOpenCreateAccount}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              New Account
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
