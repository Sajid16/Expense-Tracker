/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DollarSign, LayoutDashboard, Users, ShieldAlert, LogOut, UserCheck } from "lucide-react";
import { UserRole } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  userEmail: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  userEmail,
  onLogout,
}) => {
  return (
    <aside className="w-68 flex flex-col justify-between border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 min-h-screen">
      <div>
        {/* Logo and Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
          <div className="flex items-center justify-center p-2 rounded-xl bg-violet-600 dark:bg-violet-500 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/40">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">Expense Tracker</h1>
            <span className="text-[10px] font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400 uppercase">
              Financial Core
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="space-y-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            id="nav-tab-dashboard"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
              activeTab === "dashboard"
                ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>My Financials</span>
          </button>

          {userRole === "admin" && (
            <button
              onClick={() => setActiveTab("admin-users")}
              id="nav-tab-admin-users"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                activeTab === "admin-users"
                  ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>User Catalog</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("profile-status")}
            id="nav-tab-profile"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
              activeTab === "profile-status"
                ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {userRole === "admin" ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <UserCheck className="w-5 h-5" />
            )}
            <span>Credentials Role</span>
          </button>
        </div>
      </div>

      {/* User info & Sign Out */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4 text-xs border border-slate-100 dark:border-slate-700/50">
          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={userEmail}>
            {userEmail}
          </div>
          <div className="flex items-center justify-between mt-1 text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-wider font-bold">
            <span>Role Clear</span>
            <span className={userRole === "admin" ? "text-amber-600 dark:text-amber-400 font-bold" : "text-violet-600 dark:text-violet-400"}>
              {userRole}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="system-signout-btn"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
