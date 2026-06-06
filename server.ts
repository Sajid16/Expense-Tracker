/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  users: any[];
  incomes: any[];
  expenses: any[];
}

// Ensure database file exists with initial schema
async function initDb() {
  try {
    await fs.access(DB_FILE);
  } catch {
    const initialData: DbSchema = {
      users: [],
      incomes: [],
      expenses: [],
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    console.log("Initialized db.json with empty collections");
  }
}

async function readDb(): Promise<DbSchema> {
  const content = await fs.readFile(DB_FILE, "utf-8");
  return JSON.parse(content);
}

async function writeDb(db: DbSchema): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function generateToken(user: any): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token: string): any {
  try {
    const payloadStr = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(payloadStr);
    if (!payload.userId || !payload.expiresAt) return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

// Express app setup
async function startServer() {
  await initDb();
  const app = express();
  app.use(express.json());

  // CORS middleware for standard full-stack requests (local/preview context)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No authentication authorization header provided" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access token is missing" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Token is invalid or has expired (24 hours timeline)" });
    }

    req.user = decoded;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access level required for this action" });
    }
    next();
  };

  // --- AUTH ENDPOINTS ---

  // POST /api/register
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const assignedRole = role === "admin" ? "admin" : "guest";
      const db = await readDb();

      // Check duplicate
      const userExists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ error: "This email address is already registered" });
      }

      // Determine active status
      let active = true;
      if (assignedRole === "admin") {
        const hasExistingAdmins = db.users.some((u) => u.role === "admin");
        active = !hasExistingAdmins; // true if first admin, false if 2nd+
      }

      const newUser = {
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        email,
        password, // stored as simple string as per user instructions / JSON server mimicry
        role: assignedRole,
        active,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      await writeDb(db);

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          active: newUser.active,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const db = await readDb();
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password profile match" });
      }

      if (!user.active) {
        return res.status(403).json({
          error: "Your admin account is inactive. Approval from an existing active admin is required.",
        });
      }

      const token = generateToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/me
  app.get("/api/me", authenticateToken, async (req: any, res) => {
    try {
      const db = await readDb();
      const user = db.users.find((u) => u.id === req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User no longer exists" });
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- INCOME ENDPOINTS ---

  // GET /api/incomes
  app.get("/api/incomes", authenticateToken, async (req: any, res) => {
    try {
      const db = await readDb();
      const userIncomes = db.incomes.filter((inc) => inc.userId === req.user.userId);
      // Return sorted by date descending by default
      userIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(userIncomes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/incomes
  app.post("/api/incomes", authenticateToken, async (req: any, res) => {
    try {
      const { from, amount, date } = req.body;
      if (!from || amount === undefined || !date) {
        return res.status(400).json({ error: "Missing required income parameters (from, amount, date)" });
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Amount must be a valid positive number" });
      }

      const db = await readDb();
      const newIncome = {
        id: "inc_" + Math.random().toString(36).substr(2, 9),
        userId: req.user.userId,
        from,
        amount: parsedAmount,
        date,
      };

      db.incomes.push(newIncome);
      await writeDb(db);
      res.status(201).json(newIncome);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/incomes/:id
  app.put("/api/incomes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { from, amount, date } = req.body;

      const db = await readDb();
      const incomeIdx = db.incomes.findIndex((inc) => inc.id === id);

      if (incomeIdx === -1) {
        return res.status(404).json({ error: "Income transaction not found" });
      }

      const existingIncome = db.incomes[incomeIdx];
      if (existingIncome.userId !== req.user.userId) {
        return res.status(403).json({ error: "Not authorized to update this records" });
      }

      const parsedAmount = amount !== undefined ? parseFloat(amount) : existingIncome.amount;
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Amount must be a valid positive number" });
      }

      const updatedIncome = {
        ...existingIncome,
        from: from !== undefined ? from : existingIncome.from,
        amount: parsedAmount,
        date: date !== undefined ? date : existingIncome.date,
      };

      db.incomes[incomeIdx] = updatedIncome;
      await writeDb(db);
      res.json(updatedIncome);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/incomes/:id
  app.delete("/api/incomes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const db = await readDb();
      const income = db.incomes.find((inc) => inc.id === id);

      if (!income) {
        return res.status(404).json({ error: "Income record not found" });
      }

      if (income.userId !== req.user.userId) {
        return res.status(403).json({ error: "Not authorized to delete this records" });
      }

      db.incomes = db.incomes.filter((inc) => inc.id !== id);
      await writeDb(db);
      res.json({ message: "Income record removed successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- EXPENSE ENDPOINTS ---

  // GET /api/expenses
  app.get("/api/expenses", authenticateToken, async (req: any, res) => {
    try {
      const db = await readDb();
      const userExpenses = db.expenses.filter((exp) => exp.userId === req.user.userId);
      // Sorted by date descending
      userExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(userExpenses);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/expenses
  app.post("/api/expenses", authenticateToken, async (req: any, res) => {
    try {
      const { from, amount, date } = req.body;
      if (!from || amount === undefined || !date) {
        return res.status(400).json({ error: "Missing required expense parameters (from, amount, date)" });
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Amount must be a valid positive number" });
      }

      const db = await readDb();
      const newExpense = {
        id: "exp_" + Math.random().toString(36).substr(2, 9),
        userId: req.user.userId,
        from,
        amount: parsedAmount,
        date,
      };

      db.expenses.push(newExpense);
      await writeDb(db);
      res.status(201).json(newExpense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/expenses/:id
  app.put("/api/expenses/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { from, amount, date } = req.body;

      const db = await readDb();
      const expenseIdx = db.expenses.findIndex((exp) => exp.id === id);

      if (expenseIdx === -1) {
        return res.status(404).json({ error: "Expense transaction not found" });
      }

      const existingExpense = db.expenses[expenseIdx];
      if (existingExpense.userId !== req.user.userId) {
        return res.status(403).json({ error: "Not authorized to update this records" });
      }

      const parsedAmount = amount !== undefined ? parseFloat(amount) : existingExpense.amount;
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Amount must be a valid positive number" });
      }

      const updatedExpense = {
        ...existingExpense,
        from: from !== undefined ? from : existingExpense.from,
        amount: parsedAmount,
        date: date !== undefined ? date : existingExpense.date,
      };

      db.expenses[expenseIdx] = updatedExpense;
      await writeDb(db);
      res.json(updatedExpense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/expenses/:id
  app.delete("/api/expenses/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const db = await readDb();
      const expense = db.expenses.find((exp) => exp.id === id);

      if (!expense) {
        return res.status(404).json({ error: "Expense record not found" });
      }

      if (expense.userId !== req.user.userId) {
        return res.status(403).json({ error: "Not authorized to delete this records" });
      }

      db.expenses = db.expenses.filter((exp) => exp.id !== id);
      await writeDb(db);
      res.json({ message: "Expense record removed successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN PANEL CHANNELS ---

  // GET /api/admin/users
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const db = await readDb();
      // Remove passwords from response list for extreme visual privacy
      const sanitizedUsers = db.users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
      }));
      res.json(sanitizedUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/admin/users/:id/approve
  app.put("/api/admin/users/:id/approve", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      if (id === req.user.userId) {
        return res.status(400).json({ error: "You cannot change approval status on your own profile" });
      }

      const db = await readDb();
      const userIdx = db.users.findIndex((u) => u.id === id);

      if (userIdx === -1) {
        return res.status(404).json({ error: "User configuration profile not found" });
      }

      // Check current state and toggle
      db.users[userIdx].active = !db.users[userIdx].active;
      await writeDb(db);

      res.json({
        message: `User status set to ${db.users[userIdx].active ? "active" : "inactive"}`,
        user: {
          id: db.users[userIdx].id,
          email: db.users[userIdx].email,
          role: db.users[userIdx].role,
          active: db.users[userIdx].active,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/admin/users/:id
  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      if (id === req.user.userId) {
        return res.status(400).json({ error: "You cannot delete your own administration account" });
      }

      const db = await readDb();
      const userExists = db.users.some((u) => u.id === id);
      if (!userExists) {
        return res.status(404).json({ error: "User profile not found in system" });
      }

      // Perform Cascading Delete
      // 1. Remove the user profile from users collection
      db.users = db.users.filter((u) => u.id !== id);

      // 2. Cascade delete all incomes of that user
      db.incomes = db.incomes.filter((inc) => inc.userId !== id);

      // 3. Cascade delete all expenses of that user
      db.expenses = db.expenses.filter((exp) => exp.userId !== id);

      await writeDb(db);
      res.json({ message: "User and all associated database records removed successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite static site serving or Dev middleware serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting transparently on http://localhost:${PORT}`);
  });
}

startServer();
