/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { api, getLoggedInUser, clearAuth } from "./api";
import { User, Income, Expense, UserRole } from "./types";
import { Charts } from "./components/Charts";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { TransactionModal } from "./components/TransactionModal";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XSquare, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar, 
  Info,
  ShieldCheck,
  UserX,
  CreditCard,
  Building,
  DollarSign
} from "lucide-react";

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("expense_tracker_theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("expense_tracker_theme", isDark ? "dark" : "light");
  }, [isDark]);

  const onToggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  // Auth state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<UserRole>("guest");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Core data states
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("dashboard");

  // Pagination states (Upto 5 rows per page)
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const rowsPerPage = 5;

  // Modals controller
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("income");
  const [selectedTransaction, setSelectedTransaction] = useState<{ id?: string; from: string; amount: number; date: string } | null>(null);

  // Check login on startup
  useEffect(() => {
    const loggedUser = getLoggedInUser();
    if (loggedUser) {
      setCurrentUser(loggedUser);
    }
  }, []);

  // Fetch data only if user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      if (currentUser.role === "admin") {
        fetchAdminUsers();
      }
    } else {
      setIncomes([]);
      setExpenses([]);
      setAdminUsers([]);
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setErrorStatus(null);
    try {
      const [incData, expData] = await Promise.all([
        api.getIncomes(),
        api.getExpenses(),
      ]);
      setIncomes(incData);
      setExpenses(expData);
    } catch (err: any) {
      setErrorStatus(err.message || "Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const usersList = await api.getAdminUsers();
      setAdminUsers(usersList);
    } catch (err: any) {
      console.error("Could not fetch user registry for admin screen:", err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    setActiveTab("dashboard");
    setIncomes([]);
    setExpenses([]);
    setAdminUsers([]);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please provide both an email and account password");
      return;
    }

    try {
      if (authMode === "register") {
        const response = await api.register(authEmail.trim(), authPassword, authRole);
        setAuthSuccess(
          response.user.active 
            ? "Your account was successfully registered and is active. Please log in!"
            : "Admin profile registered. This secondary admin needs active approval from an existing admin before logging in."
        );
        // Switch to login mode
        setAuthMode("login");
        setAuthPassword("");
      } else {
        const authData = await api.login(authEmail.trim(), authPassword);
        setCurrentUser(authData.user);
        // Reset inputs
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication process failed");
    }
  };

  // --- TRANS ACTION MODAL DISPATCHERS ---

  const openAddModal = (type: "income" | "expense") => {
    setModalType(type);
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (type: "income" | "expense", item: Income | Expense) => {
    setModalType(type);
    setSelectedTransaction({ id: item.id, from: item.from, amount: item.amount, date: item.date });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (from: string, amount: number, date: string) => {
    if (modalType === "income") {
      if (selectedTransaction?.id) {
        await api.updateIncome(selectedTransaction.id, from, amount, date);
      } else {
        await api.addIncome(from, amount, date);
      }
    } else {
      if (selectedTransaction?.id) {
        await api.updateExpense(selectedTransaction.id, from, amount, date);
      } else {
        await api.addExpense(from, amount, date);
      }
    }
    // Refresh cashflow database records
    await fetchUserData();
    setIncomePage(1);
    setExpensePage(1);
  };

  const handleDeleteTransaction = async (type: "income" | "expense", id: string) => {
    if (!window.confirm("Are you positive you wish to remove this record permanently?")) {
      return;
    }
    try {
      if (type === "income") {
        await api.deleteIncome(id);
      } else {
        await api.deleteExpense(id);
      }
      await fetchUserData();
    } catch (err: any) {
      alert(err.message || "Failed to remove this transaction record");
    }
  };

  // --- ADMIN ACTIONS ---

  const handleToggleApproval = async (userId: string) => {
    try {
      await api.toggleUserApprove(userId);
      await fetchAdminUsers();
    } catch (err: any) {
      alert(err.message || "Unable to modify verification status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Warning! Deleting this user will also wipe all their transaction tables from server. Proceed with deletion?")) {
      return;
    }
    try {
      await api.deleteUser(userId);
      await fetchAdminUsers();
      // If admin deletes self (though API guards it), log out. Just in case.
      if (userId === currentUser?.id) {
        handleLogout();
      }
    } catch (err: any) {
      alert(err.message || "Unsuccessful user record cleanup");
    }
  };

  // --- PAGINATION SLICERS ---

  const paginatedIncomes = incomes.slice((incomePage - 1) * rowsPerPage, incomePage * rowsPerPage);
  const totalIncomePages = Math.ceil(incomes.length / rowsPerPage) || 1;

  const paginatedExpenses = expenses.slice((expensePage - 1) * rowsPerPage, expensePage * rowsPerPage);
  const totalExpensePages = Math.ceil(expenses.length / rowsPerPage) || 1;

  // Render authentic authentication template if user holds no valid server-tied session
  if (!currentUser) {
    return (
      <div id="auth-container-screen" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 select-none">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl">
            {/* Form Logo Header */}
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="mt-6 font-display font-bold text-3xl text-slate-800 dark:text-slate-100 tracking-tight">
                {authMode === "login" ? "Welcome back" : "Create administrative/guest profile"}
              </h2>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                {authMode === "login" 
                  ? "Input credentials to view or record financial balances" 
                  : "Pick standard roles carefully for proper administrative authorization levels"}
              </p>
            </div>

            {/* Error alerts */}
            {authError && (
              <div id="auth-error-output" className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Success alerts */}
            {authSuccess && (
              <div id="auth-success-output" className="flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Registration/Login entry form */}
            <form onSubmit={handleAuthSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                {/* Email address input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    id="auth-input-email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                  />
                </div>

                {/* Password field input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                    Secure password
                  </label>
                  <input
                    type="password"
                    required
                    id="auth-input-password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-medium"
                  />
                </div>

                {/* Register role selection options */}
                {authMode === "register" && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                      Target role assignment
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="role-select-guest"
                        onClick={() => setAuthRole("guest")}
                        className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                          authRole === "guest"
                            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-semibold"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-sm font-medium">Default Guest</span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">Need no approvals</span>
                      </button>

                      <button
                        type="button"
                        id="role-select-admin"
                        onClick={() => setAuthRole("admin")}
                        className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                          authRole === "admin"
                            ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 font-semibold"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-sm font-medium">Administrator</span>
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">Needs approvals (2nd+)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fire submission trigger button */}
              <button
                type="submit"
                id="auth-submit-btn"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
              >
                {authMode === "login" ? "Verify Credentials & Enter" : "Register Database Account"}
              </button>
            </form>

            {/* Quick Auth state swapping toggle links */}
            <div className="text-center pt-2">
              <button
                type="button"
                id="toggle-auth-mode-btn"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
              >
                {authMode === "login" 
                  ? "Don't hold an active profile description yet? Go register" 
                  : "Already hold an approved login account? Switch to sign in"}
              </button>
            </div>
          </div>
        </div>

        {/* Global Footer (Outside Login Container) */}
        <footer id="auth-outer-footer" className="text-center text-slate-400 dark:text-slate-600 font-mono text-[10px] tracking-widest uppercase mt-8 select-none">
          keep as you feel better
        </footer>
      </div>
    );
  }

  // --- MAIN PRIVATE WORKSPACE DESKTOP GRID LAYOUT ---
  return (
    <div id="private-workspace-dashboard" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex select-none">
      {/* Side menus drawer block */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentUser.role}
        userEmail={currentUser.email}
        onLogout={handleLogout}
      />

      {/* Primary content area panel */}
      <div className="flex-1 flex flex-col justify-between max-w-[calc(100vw-17rem)] min-h-screen">
        <div>
          {/* Main system header */}
          <Topbar
            userEmail={currentUser.email}
            userRole={currentUser.role}
            onLogout={handleLogout}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
          />

          {/* Tab Content Display Container */}
          <main className="p-8">
            {errorStatus && (
              <div className="mb-6 flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorStatus}</span>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* Upper Charts section */}
                <Charts incomes={incomes} expenses={expenses} />

                {/* Lower List displays splits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Incomes Box */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[460px]">
                    <div>
                      {/* Sub-header block */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 mb-4">
                        <div>
                          <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                            <span>Recorded Incomes</span>
                          </h3>
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Manage cash flow inflows</p>
                        </div>
                        <button
                          onClick={() => openAddModal("income")}
                          id="add-income-modal-trigger"
                          className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Income</span>
                        </button>
                      </div>

                      {/* Financial Rows table listing */}
                      <div className="overflow-x-auto min-h-[260px]">
                        {paginatedIncomes.length === 0 ? (
                          <div className="h-[240px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                            <Plus className="w-10 h-10 stroke-1 mb-2 text-slate-200 dark:text-slate-700" />
                            <p className="text-xs font-medium">No income data matching this profile</p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-50 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <th className="pb-3 pl-1 font-medium">Income Origin / Source</th>
                                <th className="pb-3 text-right font-medium">Date</th>
                                <th className="pb-3 text-right font-medium pr-3">Amount</th>
                                <th className="pb-3 text-center font-medium w-20">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {paginatedIncomes.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-3 pl-1 text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-[140px] truncate" title={item.from}>
                                    {item.from}
                                  </td>
                                  <td className="py-3 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {item.date}
                                  </td>
                                  <td className="py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400 font-display pr-3">
                                    +${item.amount.toLocaleString()}
                                  </td>
                                  <td className="py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => openEditModal("income", item)}
                                        className="p-1 rounded-md text-slate-400 hover:text-indigo-650 hover:bg-slate-100 transition-colors"
                                        title="Modify income transaction details"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction("income", item.id)}
                                        className="p-1 rounded-md text-slate-400 hover:text-red-650 hover:bg-slate-100 transition-colors"
                                        title="Discard income account"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Pagination controller footer box */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 text-xs">
                      <div className="text-slate-400 dark:text-slate-500 font-medium">
                        Showing page <span className="font-bold text-slate-700 dark:text-slate-300">{incomePage}</span> of {totalIncomePages} ({incomes.length} total)
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setIncomePage(prev => Math.max(1, prev - 1))}
                          disabled={incomePage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIncomePage(prev => Math.min(totalIncomePages, prev + 1))}
                          disabled={incomePage === totalIncomePages}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Expenses Box */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between min-h-[460px]">
                    <div>
                      {/* Sub-header block */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 mb-4">
                        <div>
                          <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                            <span>Recorded Expenses</span>
                          </h3>
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Control outgoings & liabilities</p>
                        </div>
                        <button
                          onClick={() => openAddModal("expense")}
                          id="add-expense-modal-trigger"
                          className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Expense</span>
                        </button>
                      </div>

                      {/* Financial Rows table listing */}
                      <div className="overflow-x-auto min-h-[260px]">
                        {paginatedExpenses.length === 0 ? (
                          <div className="h-[240px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                            <Plus className="w-10 h-10 stroke-1 mb-2 text-slate-200 dark:text-slate-700" />
                            <p className="text-xs font-medium">No expense items logged under this name</p>
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-50 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <th className="pb-3 pl-1 font-medium">Expense To / Vendor</th>
                                <th className="pb-3 text-right font-medium">Date</th>
                                <th className="pb-3 text-right font-medium pr-3">Amount</th>
                                <th className="pb-3 text-center font-medium w-20">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {paginatedExpenses.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="py-3 pl-1 text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-[140px] truncate" title={item.from}>
                                    {item.from}
                                  </td>
                                  <td className="py-3 text-right text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {item.date}
                                  </td>
                                  <td className="py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400 font-display pr-3">
                                    -${item.amount.toLocaleString()}
                                  </td>
                                  <td className="py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => openEditModal("expense", item)}
                                        className="p-1 rounded-md text-slate-400 hover:text-indigo-650 hover:bg-slate-100 transition-colors"
                                        title="Modify expense transaction details"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTransaction("expense", item.id)}
                                        className="p-1 rounded-md text-slate-400 hover:text-red-650 hover:bg-slate-100 transition-colors"
                                        title="Discard expense entry"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Pagination controller footer box */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 text-xs">
                      <div className="text-slate-400 dark:text-slate-500 font-medium">
                        Showing page <span className="font-bold text-slate-700 dark:text-slate-300">{expensePage}</span> of {totalExpensePages} ({expenses.length} total)
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpensePage(prev => Math.max(1, prev - 1))}
                          disabled={expensePage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpensePage(prev => Math.min(totalExpensePages, prev + 1))}
                          disabled={expensePage === totalExpensePages}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin user-management catalog */}
            {activeTab === "admin-users" && currentUser.role === "admin" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm animate-fade-in">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-lg">Administrative User Registry</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    Control portal configuration, grant system-wide active clearances to newer admins, or delete members
                  </p>
                </div>

                <div className="overflow-x-auto">
                  {adminUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-450 font-medium">
                      No registrants populated in index database.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase font-semibold tracking-wider pb-3">
                          <th className="pb-3 font-medium">User Profile Email</th>
                          <th className="pb-3 font-medium">Registered Date</th>
                          <th className="pb-3 font-medium text-center">System Role</th>
                          <th className="pb-3 font-medium text-center">Active Status</th>
                          <th className="pb-3 font-medium text-center">Clearance Action</th>
                          <th className="pb-3 font-medium text-center">Discard</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {adminUsers.map((user) => {
                          const isSelf = user.id === currentUser.id;
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              {/* Email Row */}
                              <td className="py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                  <span>{user.email}</span>
                                  {isSelf && (
                                    <span className="bg-blue-50 text-blue-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase">
                                      You
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Registered date */}
                              <td className="py-4 text-xs font-mono text-slate-400 dark:text-slate-500">
                                {new Date(user.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>

                              {/* Assigned role status badge */}
                              <td className="py-4 text-center">
                                <span
                                  className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    user.role === "admin"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-violet-50 text-violet-700 border border-violet-200"
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>

                              {/* Status boolean */}
                              <td className="py-4 text-center">
                                <span
                                  className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    user.active
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}
                                >
                                  {user.active ? "Active" : "Inactive / Blocked"}
                                </span>
                              </td>

                              {/* Status Toggle Clearance button Action */}
                              <td className="py-4 text-center">
                                {user.role === "admin" ? (
                                  <button
                                    onClick={() => handleToggleApproval(user.id)}
                                    disabled={isSelf}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border select-none ${
                                      isSelf
                                        ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                                        : user.active
                                        ? "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100/50"
                                        : "bg-emerald-50 border-emerald-110 text-emerald-700 hover:bg-emerald-100/50"
                                    }`}
                                  >
                                    {user.active ? "Revoke Status" : "Authorize Active"}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs font-mono select-none">No action required</span>
                                )}
                              </td>

                              {/* Discard delete row capability */}
                              <td className="py-4 text-center">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={isSelf}
                                  className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${
                                    isSelf
                                      ? "text-slate-300 cursor-not-allowed"
                                      : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  }`}
                                  title={isSelf ? "You cannot delete yourself" : "Wipe user and association records"}
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Profile configuration view stats tab */}
            {activeTab === "profile-status" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl animate-fade-in">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h3 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-lg">My Authorization Profile</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Logged session properties and credentials roles clear verified</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                        Principal email
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentUser.email}</span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                        Assigned Credentials-Role
                      </span>
                      <span className="text-sm font-bold text-violet-700 dark:text-violet-400 font-display capitalize">
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                        Approved Activation Clear
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-4 h-4" /> Allowed Live Session
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">
                        Token Lifespan Timeline
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        24 Hours Expire window
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                      <Info className="w-4 h-4" /> System Integration Architecture Notification
                    </div>
                    <p>
                      This account is running on an Express Node.js application that proxies persistent 
                      data files seamlessly on the server inside a <code className="font-mono bg-amber-140/40 px-1 py-0.5 rounded font-semibold">db.json</code> file, fully mirroring complex json-server capabilities.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Keeping layout beautiful with requested footer context */}
        <footer id="dashboard-footer-bar" className="py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400 dark:text-slate-600 font-mono text-[10px] tracking-widest uppercase select-none">
          keep as you feel better
        </footer>
      </div>

      {/* Unified Transaction popup editor */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        initialData={selectedTransaction}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
