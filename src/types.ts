/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "admin" | "guest";

export interface User {
  id: string;
  email: string;
  password?: string; // Optional on client for security
  role: UserRole;
  active: boolean;
  createdAt: string; // ISO string
}

export interface Income {
  id: string;
  userId: string;
  from: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  userId: string;
  from: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    active: boolean;
  };
}
