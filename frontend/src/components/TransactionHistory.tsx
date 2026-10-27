import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Receipt,
  Search,
  Copy,
  Check,
  Filter,
  Eye,
} from 'lucide-react';
import { CurrencyCode, PaginatedResult, Transaction } from '../types.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

interface TransactionHistoryProps {
  paginatedData: PaginatedResult<Transaction> | null;
  loading: boolean;
  currency: CurrencyCode;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onSelectTransactionForReceipt: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  paginatedData,
  loading,
  currency,
  onPageChange,
  onLimitChange,
  onSelectTransactionForReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawTransactions = paginatedData?.data || [];
  const pagination = paginatedData?.pagination;

  // Filter transactions client-side for the current page
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      const matchesSearch =
        tx.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.amount.toString().includes(searchTerm);

      const matchesFilter = filterType === 'all' || tx.type === filterType;

      return matchesSearch && matchesFilter;
    });
  }, [rawTransactions, searchTerm, filterType]);

  const handleCopy = (e: React.MouseEvent, refId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics on current page
  const totalCredits = rawTransactions
    .filter((tx) => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebits = rawTransactions
    .filter((tx) => tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header & Title */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Ledger Statement</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-slate-500" /> Immutable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time double-entry transactions (sorted Latest-First)
          </p>
        </div>

        {/* Page Flow Totals */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 font-semibold">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>In: {formatCurrency(totalCredits, currency)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1.5 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Out: {formatCurrency(totalDebits, currency)}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reference or note..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/60"
          />
        </div>

        {/* Filter Tabs & Limit */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex p-0.5 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterType === 'credit' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Credits
            </button>
            <button
              onClick={() => setFilterType('debit')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterType === 'debit' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Debits
            </button>
          </div>

          <select
            value={pagination?.pageSize || 10}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
      </div>

      {/* Table Body */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-2"></div>
          <p className="font-medium">Fetching verified ledger entries...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-20 px-4 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No matching transactions</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Deposit or transfer funds to populate this account's verified ledger statement.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-bold">Type</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Amount</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Reference Key</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Description</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Timestamp</th>
                <th scope="col" className="px-6 py-3.5 font-bold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransactionForReceipt(tx)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isCredit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" /> Debit
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold">
                      <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200/80 font-medium">
                          {tx.reference_id}
                        </span>
                        <button
                          onClick={(e) => handleCopy(e, tx.reference_id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          title="Copy Key"
                        >
                          {copiedId === tx.reference_id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-700 max-w-xs truncate font-medium">
                      {tx.description || <span className="text-slate-400 italic">Direct Transaction</span>}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(tx.created_at)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:underline">
                        <Eye className="w-3 h-3" /> View
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalRecords > 0 && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing page <span className="font-bold text-slate-900">{pagination.currentPage}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.totalPages}</span>{' '}
            (<span className="font-bold text-slate-900">{pagination.totalRecords}</span> ledger transactions)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                return (
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.currentPage) <= 1
                );
              })
              .map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pagination.currentPage === pageNumber
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
