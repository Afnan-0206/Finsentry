import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Repeat,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Wallet,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Transaction } from '@/types';
import { cn, formatINR } from '@/lib/utils';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { CSVImportModal } from '@/components/transactions/CSVImportModal';
import { BentoCard, BentoMetric } from '@/components/ui/finance-bento';

const CATEGORIES = [
  'All',
  'Food',
  'Groceries',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Education',
  'Health',
  'Utilities',
  'Housing',
  'Subscriptions',
  'Travel',
  'Salary',
  'Freelance',
  'Other',
];

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        skip: 0,
        limit: 1000,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedType !== 'All') params.transaction_type = selectedType;

      const data = await api.getTransactions(params);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedCategory, selectedType, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      try {
        await api.deleteTransaction(id);
        fetchTransactions();
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportTransactionsCSV({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        transaction_type: selectedType !== 'All' ? selectedType : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finsentry_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export CSV failed', err);
      alert('Failed to export transactions CSV.');
    }
  };

  const totalFilteredIncome = transactions
    .filter((t) => t.transaction_type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalFilteredExpense = transactions
    .filter((t) => t.transaction_type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Verified records audited by Isolation Forest models
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all font-mono"
          >
            <Upload className="w-3.5 h-3.5 text-[#E8FF1F]" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => {
              setTransactionToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-[#d4eb17] transition-all shadow-bento"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Bento KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BentoCard className="p-4 sm:p-5">
          <BentoMetric
            label="Inflow Captured"
            value={totalFilteredIncome}
            subtext="Filtered Inflows"
            accentColor="green"
          />
        </BentoCard>

        <BentoCard className="p-4 sm:p-5">
          <BentoMetric
            label="Outflow Disbursed"
            value={totalFilteredExpense}
            subtext="Filtered Expenditures"
            accentColor="copper"
          />
        </BentoCard>

        <BentoCard className="p-4 sm:p-5">
          <BentoMetric
            label="Ledger Volume"
            value={`${transactions.length} Records`}
            subtext="Grounded in SQLite"
            accentColor="lime"
            isCurrency={false}
          />
        </BentoCard>
      </div>

      {/* Filter and Search Bar */}
      <BentoCard className="p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant, narration, or UTR..."
              className="w-full pl-9 pr-4 py-2 bg-[#0B0B0D] border border-white/[0.08] rounded-xl text-xs text-white placeholder-white/30 focus:border-[#E8FF1F] focus:ring-1 focus:ring-[#E8FF1F] focus:outline-none"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#0B0B0D] border border-white/[0.08] rounded-xl text-white font-medium focus:border-[#E8FF1F] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-[#0B0B0D] border border-white/[0.08] rounded-xl text-white font-medium focus:border-[#E8FF1F] focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Incomes Only</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#0B0B0D] border border-white/[0.08] rounded-xl text-white font-mono focus:border-[#E8FF1F] focus:outline-none"
            >
              <option value="date_desc">Latest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </BentoCard>

      {/* Transactions Table / List */}
      <BentoCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-white/40">
            <RefreshCw className="w-8 h-8 animate-spin text-[#E8FF1F] mx-auto mb-3" />
            <p className="text-xs font-mono">Filtering transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-24 text-center text-white/30 font-mono text-xs">
            No transactions match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0B0D] border-b border-white/[0.08] text-[10px] font-mono text-white/40 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Merchant / Narration</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-5 font-mono text-white/50 text-[11px] whitespace-nowrap">
                      {tx.transaction_date}
                    </td>

                    {/* Merchant & Description */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[11px] shrink-0',
                            tx.transaction_type === 'income'
                              ? 'bg-[#58B58C]/15 text-[#58B58C] border border-[#58B58C]/30'
                              : 'bg-white/[0.04] text-white/70 border border-white/[0.08]'
                          )}
                        >
                          {tx.merchant ? tx.merchant.slice(0, 1).toUpperCase() : 'T'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span className="truncate">{tx.merchant || tx.description}</span>
                            {tx.is_recurring && (
                              <span className="px-1.5 py-0.2 rounded bg-[#E8FF1F]/10 border border-[#E8FF1F]/30 text-[#E8FF1F] text-[9px] font-mono font-bold shrink-0">
                                Recurring
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/40 truncate block max-w-xs">
                            {tx.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/70 text-[10px] font-mono">
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-white/50 font-mono text-[11px]">
                      {tx.payment_method || 'UPI'}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          'font-mono font-bold text-xs',
                          tx.transaction_type === 'income' ? 'text-[#58B58C]' : 'text-white'
                        )}
                      >
                        {tx.transaction_type === 'income'
                          ? `+${formatINR(tx.amount)}`
                          : `-${formatINR(tx.amount)}`}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setTransactionToEdit(tx);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSaved={fetchTransactions}
        transactionToEdit={transactionToEdit}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchTransactions}
      />
    </div>
  );
};
