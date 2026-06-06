/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Income, Expense } from "../types";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from "lucide-react";

interface ChartsProps {
  incomes: Income[];
  expenses: Expense[];
}

export const Charts: React.FC<ChartsProps> = ({ incomes, expenses }) => {
  const totalIncome = useMemo(() => incomes.reduce((sum, item) => sum + item.amount, 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((balance / totalIncome) * 100))) : 0;

  const monthlyData = useMemo(() => {
    const dates = [...incomes.map(i => i.date), ...expenses.map(e => e.date)];
    if (dates.length === 0) {
      return [
        { name: "Jan", income: 0, expense: 0 },
        { name: "Feb", income: 0, expense: 0 },
        { name: "Mar", income: 0, expense: 0 },
        { name: "Apr", income: 0, expense: 0 },
        { name: "May", income: 0, expense: 0 },
        { name: "Jun", income: 0, expense: 0 },
      ];
    }

    const monthsMap: Record<string, { income: number; expense: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthsMap[key] = { income: 0, expense: 0 };
    }

    incomes.forEach((inc) => {
      const parts = inc.date.split("-");
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        if (monthsMap[key]) monthsMap[key].income += inc.amount;
      }
    });

    expenses.forEach((exp) => {
      const parts = exp.date.split("-");
      if (parts.length >= 2) {
        const key = `${parts[0]}-${parts[1]}`;
        if (monthsMap[key]) monthsMap[key].expense += exp.amount;
      }
    });

    return Object.entries(monthsMap).map(([key, value]) => {
      const [year, monthNum] = key.split("-");
      const name = monthNames[parseInt(monthNum, 10) - 1];
      return { name: `${name} ${year.slice(-2)}`, income: value.income, expense: value.expense };
    });
  }, [incomes, expenses]);

  const maxVal = useMemo(() => {
    const maxNumber = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)));
    return maxNumber > 0 ? maxNumber * 1.15 : 1000;
  }, [monthlyData]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Balance */}
        <div id="stat-card-balance" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Net Balance</div>
            <div className={`p-2 rounded-xl ${balance >= 0 ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold font-display tracking-tight ${balance >= 0 ? "text-slate-900 dark:text-slate-100" : "text-rose-600 dark:text-rose-400"}`}>
              {formatCurrency(balance)}
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-xs mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Current surplus funds</span>
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div id="stat-card-income" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Income</div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
              {formatCurrency(totalIncome)}
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-xs mt-1 font-medium">
              {incomes.length} incoming transactions
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div id="stat-card-expense" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Expenses</div>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
              {formatCurrency(totalExpense)}
            </div>
            <div className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">
              {expenses.length} spending records
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div id="stat-card-savings" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Savings Rate</div>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-display tracking-tight text-slate-800 dark:text-slate-100">
              {savingsRate}%
            </div>
            <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-violet-600 dark:bg-violet-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${savingsRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
          <div>
            <h3 className="font-display font-medium text-lg text-slate-800 dark:text-slate-100">Cash Flow Evolution</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Income vs expenses across the last 6 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
              <span className="text-slate-600 dark:text-slate-400">Total Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
              <span className="text-slate-600 dark:text-slate-400">Expenses Spend</span>
            </div>
          </div>
        </div>

        <div className="w-full h-64 md:h-72 mt-4 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400 dark:text-slate-600">
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1 flex justify-between">
              <span>{formatCurrency(maxVal)}</span>
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{formatCurrency(maxVal * 0.75)}</span>
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{formatCurrency(maxVal * 0.5)}</span>
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{formatCurrency(maxVal * 0.25)}</span>
            </div>
            <div className="text-slate-300 dark:text-slate-700 font-bold">
              <span>$0</span>
            </div>
          </div>

          <div className="h-full w-full pt-4 pb-6 px-12 relative z-10 flex justify-between items-end gap-2 md:gap-4">
            {monthlyData.map((data, index) => {
              const incPercent = (data.income / maxVal) * 100;
              const expPercent = (data.expense / maxVal) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50 flex flex-col gap-0.5 whitespace-nowrap min-w-[120px] left-1/2 -translate-x-1/2">
                    <span className="font-semibold text-slate-300 dark:text-slate-200">{data.name}</span>
                    <span className="text-emerald-400">Income: {formatCurrency(data.income)}</span>
                    <span className="text-rose-400">Expense: {formatCurrency(data.expense)}</span>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 md:gap-2 h-full pb-2">
                    <div className="w-4 sm:w-6 md:w-8 flex flex-col justify-end h-full">
                      <div
                        className="bg-emerald-500 dark:bg-emerald-500 rounded-t-lg transition-all duration-1000 ease-out hover:bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        style={{ height: `${Math.max(2, incPercent)}%` }}
                      ></div>
                    </div>
                    <div className="w-4 sm:w-6 md:w-8 flex flex-col justify-end h-full">
                      <div
                        className="bg-rose-500 dark:bg-rose-500 rounded-t-lg transition-all duration-1000 ease-out hover:bg-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        style={{ height: `${Math.max(2, expPercent)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-display mt-1">
                    {data.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
