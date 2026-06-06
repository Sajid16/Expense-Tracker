/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, DollarSign, Edit, PlusCircle, AlertCircle } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "income" | "expense";
  initialData?: { id?: string; from: string; amount: number; date: string } | null;
  onSave: (from: string, amount: number, date: string) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  initialData,
  onSave,
}) => {
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFrom(initialData.from);
      setAmount(String(initialData.amount));
      setDate(initialData.date);
    } else {
      setFrom("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!from.trim()) { setError(`"Source/Recipient From" is a required field`); return; }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) { setError("Please key in a valid positive numeric amount"); return; }
    if (!date) { setError("Please designate a transaction date"); return; }
    setIsSubmitting(true);
    try {
      await onSave(from.trim(), numericAmount, date);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred saving this record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            type === "income"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50/80 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {isEditing ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            <span className="font-display font-semibold text-base">
              {isEditing ? "Modify" : "Record"} {type === "income" ? "Income Entry" : "Expense Entry"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs px-3.5 py-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {type === "income" ? "Income From" : "Expense Destination"}
            </label>
            <input
              type="text"
              placeholder={type === "income" ? "e.g., Salary, Freelance project" : "e.g., Target Grocery, Electric bill"}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
              maxLength={80}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Amount ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Activity Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-colors hover:cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="modal-submit-entry-btn"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all duration-150 transform active:scale-95 disabled:opacity-50 ${
                type === "income"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100 dark:shadow-emerald-900/30"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-100 dark:shadow-rose-900/30"
              }`}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Apply Changes" : "Commit Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
