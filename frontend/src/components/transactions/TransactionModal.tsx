import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import type { Transaction, TransactionCreate } from '../../types';
import { api } from '../../services/api';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transactionToEdit?: Transaction | null;
}

const CATEGORIES = [
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

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Auto-Debit'];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  transactionToEdit,
}) => {
  const [formData, setFormData] = useState<TransactionCreate>({
    merchant: '',
    description: '',
    amount: 0,
    transaction_type: 'expense',
    category: 'Food',
    payment_method: 'UPI',
    transaction_date: new Date().toISOString().split('T')[0],
    reference: '',
    is_recurring: false,
  });

  const [aiPrediction, setAiPrediction] = useState<{
    category: string;
    confidence: number;
    explanation: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        merchant: transactionToEdit.merchant,
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        transaction_type: transactionToEdit.transaction_type,
        category: transactionToEdit.category,
        payment_method: transactionToEdit.payment_method,
        transaction_date: transactionToEdit.transaction_date,
        reference: transactionToEdit.reference || '',
        is_recurring: transactionToEdit.is_recurring,
      });
      setAiPrediction(null);
    } else {
      setFormData({
        merchant: '',
        description: '',
        amount: 0,
        transaction_type: 'expense',
        category: 'Food',
        payment_method: 'UPI',
        transaction_date: new Date().toISOString().split('T')[0],
        reference: '',
        is_recurring: false,
      });
      setAiPrediction(null);
    }
    setError(null);
  }, [isOpen, transactionToEdit]);

  if (!isOpen) return null;

  const handleDescriptionBlur = async () => {
    const textToClassify = `${formData.merchant} ${formData.description}`.trim();
    if (textToClassify.length >= 3 && !transactionToEdit) {
      try {
        const pred = await api.categorizeTransaction(textToClassify);
        if (pred && pred.category) {
          setAiPrediction(pred);
          setFormData((prev) => ({ ...prev, category: pred.category }));
        }
      } catch (err) {
        console.warn('AI categorization prediction skipped', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.amount <= 0) {
      setError('Amount must be greater than ₹0');
      return;
    }

    try {
      setIsSubmitting(true);
      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, formData);
      } else {
        await api.createTransaction(formData);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save transaction', err);
      const msg = err?.response?.data?.detail || 'Failed to save transaction record.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#121215] rounded-[24px] shadow-2xl border border-white/[0.1] overflow-hidden z-10 text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#151518]">
          <div>
            <h3 className="font-extrabold text-white text-base">
              {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-white/40 font-mono">
              {transactionToEdit ? 'Update ledger entry' : 'AI automatically detects categories and flags anomalies'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1">Transaction Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white font-medium focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income (Inflow)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 649.00"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] font-mono font-bold text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
              />
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block font-semibold text-white/70 mb-1">Merchant / Payee</label>
            <input
              type="text"
              required
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              onBlur={handleDescriptionBlur}
              placeholder="e.g. Netflix, Swiggy, Uber, Croma Electronics"
              className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-white/70 mb-1">Description / Narration</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onBlur={handleDescriptionBlur}
              placeholder="e.g. Monthly Standard Subscription renewal"
              className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
            />
          </div>

          {/* AI Category Suggestion Pill */}
          {aiPrediction && (
            <div className="p-2.5 rounded-xl bg-[#E8FF1F]/[0.08] border border-[#E8FF1F]/20 text-[#E8FF1F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E8FF1F] shrink-0" />
                <span>
                  Categorized as <strong>{aiPrediction.category}</strong> ({aiPrediction.confidence}% confidence)
                </span>
              </div>
              <span className="text-[10px] text-black bg-[#E8FF1F] px-2 py-0.5 rounded-md font-mono font-bold">
                AI Match
              </span>
            </div>
          )}

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-white/70 mb-1">Transaction Date</label>
              <input
                type="date"
                required
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-white/70 mb-1">Reference / UTR (Optional)</label>
              <input
                type="text"
                value={formData.reference || ''}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="e.g. TXN98765432"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#0B0B0D] text-white focus:ring-1 focus:ring-[#E8FF1F] focus:border-[#E8FF1F] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Recurrence Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0B0B0D] border-white/20 text-[#E8FF1F] focus:ring-[#E8FF1F]"
            />
            <label htmlFor="is_recurring" className="text-white/70 font-medium cursor-pointer">
              Mark as known recurring payment (subscription, rent, utility bill)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/[0.06] font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#E8FF1F] text-black font-extrabold hover:bg-[#d4eb17] transition-all disabled:opacity-50 shadow-bento"
            >
              {isSubmitting ? 'Saving...' : transactionToEdit ? 'Update Record' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
