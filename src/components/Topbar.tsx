/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LogOut, User, Shield, Briefcase, Sun, Moon } from "lucide-react";
import { UserRole } from "../types";

interface TopbarProps {
  userEmail: string;
  userRole: UserRole;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ userEmail, userRole, onLogout, isDark, onToggleTheme }) => {
  return (
    <header className="h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 select-none">
      {/* Top Left Greeting */}
      <div className="flex items-center gap-2">
        <h2 className="font-display font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base flex items-center gap-1.5">
          <span>Hello,</span>
          <span className="text-violet-600 dark:text-violet-400 font-bold max-w-[150px] sm:max-w-[250px] truncate" title={userEmail}>
            {userEmail}
          </span>
        </h2>
        {userRole === "admin" ? (
          <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">
            <Briefcase className="w-3 h-3" />
            <span>Guest</span>
          </span>
        )}
      </div>

      {/* Top Right Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-semibold tracking-wider hidden sm:inline">
            Active session
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onLogout}
          id="topbar-logout-btn"
          className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1"
          title="Sign out of the system"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </header>
  );
};
