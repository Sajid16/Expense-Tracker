/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthResponse, Income, Expense, User } from "./types";

const API_ROOT = "";

export function setToken(token: string, user: any) {
  localStorage.setItem("expense_tracker_token", token);
  localStorage.setItem("expense_tracker_user", JSON.stringify(user));
  localStorage.setItem("expense_tracker_token_time", Date.now().toString());
}

export function clearAuth() {
  localStorage.removeItem("expense_tracker_token");
  localStorage.removeItem("expense_tracker_user");
  localStorage.removeItem("expense_tracker_token_time");
}

export function getToken(): string | null {
  const token = localStorage.getItem("expense_tracker_token");
  const timeStr = localStorage.getItem("expense_tracker_token_time");

  if (!token || !timeStr) {
    return null;
  }

  const createdAt = parseInt(timeStr, 10);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Check if token is generated more than 24 hours ago
  if (now - createdAt > dayInMs) {
    clearAuth();
    return null;
  }

  return token;
}

export function getLoggedInUser(): any | null {
  if (!getToken()) return null;
  const userStr = localStorage.getItem("expense_tracker_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

async function request(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth calls
  register: async (email: string, password: string, role: string): Promise<{ message: string; user: any }> => {
    return request(`${API_ROOT}/api/register`, {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data: AuthResponse = await request(`${API_ROOT}/api/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token, data.user);
    return data;
  },

  getCurrentProfile: async (): Promise<{ user: any }> => {
    return request(`${API_ROOT}/api/me`);
  },

  // Income transactions
  getIncomes: async (): Promise<Income[]> => {
    return request(`${API_ROOT}/api/incomes`);
  },

  addIncome: async (from: string, amount: number, date: string): Promise<Income> => {
    return request(`${API_ROOT}/api/incomes`, {
      method: "POST",
      body: JSON.stringify({ from, amount, date }),
    });
  },

  updateIncome: async (id: string, from: string, amount: number, date: string): Promise<Income> => {
    return request(`${API_ROOT}/api/incomes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ from, amount, date }),
    });
  },

  deleteIncome: async (id: string): Promise<{ message: string }> => {
    return request(`${API_ROOT}/api/incomes/${id}`, {
      method: "DELETE",
    });
  },

  // Expense transactions
  getExpenses: async (): Promise<Expense[]> => {
    return request(`${API_ROOT}/api/expenses`);
  },

  addExpense: async (from: string, amount: number, date: string): Promise<Expense> => {
    return request(`${API_ROOT}/api/expenses`, {
      method: "POST",
      body: JSON.stringify({ from, amount, date }),
    });
  },

  updateExpense: async (id: string, from: string, amount: number, date: string): Promise<Expense> => {
    return request(`${API_ROOT}/api/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify({ from, amount, date }),
    });
  },

  deleteExpense: async (id: string): Promise<{ message: string }> => {
    return request(`${API_ROOT}/api/expenses/${id}`, {
      method: "DELETE",
    });
  },

  // Admin capabilities
  getAdminUsers: async (): Promise<User[]> => {
    return request(`${API_ROOT}/api/admin/users`);
  },

  toggleUserApprove: async (id: string): Promise<{ message: string; user: any }> => {
    return request(`${API_ROOT}/api/admin/users/${id}/approve`, {
      method: "PUT",
    });
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return request(`${API_ROOT}/api/admin/users/${id}`, {
      method: "DELETE",
    });
  },
};
