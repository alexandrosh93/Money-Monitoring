import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'money.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS money_monitor_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#2563eb',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS money_monitor_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS money_monitor_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL CHECK(amount > 0),
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category_id INTEGER,
    account_id INTEGER,
    description TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES money_monitor_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES money_monitor_accounts(id) ON DELETE RESTRICT
  );
`);

const txColumns = db.prepare("PRAGMA table_info(money_monitor_transactions)").all().map(column => column.name);
if (!txColumns.includes('account_id')) {
  db.exec('ALTER TABLE money_monitor_transactions ADD COLUMN account_id INTEGER REFERENCES money_monitor_accounts(id) ON DELETE RESTRICT');
}

// Seed default money_monitor_accounts if empty
const accountCount = db.prepare('SELECT COUNT(*) as c FROM money_monitor_accounts').get();
if (accountCount.c === 0) {
  const insertAccount = db.prepare('INSERT INTO money_monitor_accounts (name, color) VALUES (?, ?)');
  const seedAccounts = db.transaction(() => {
    [
      ['Main Pool', '#2563eb'],
      ['Anna', '#ec4899'],
      ['Stelios', '#f97316'],
      ['Alexandros', '#8b5cf6'],
    ].forEach(([name, color]) => insertAccount.run(name, color));
  });
  seedAccounts();
}

// Seed default money_monitor_categories if empty
const count = db.prepare('SELECT COUNT(*) as c FROM money_monitor_categories').get();
if (count.c === 0) {
  const insert = db.prepare('INSERT INTO money_monitor_categories (name, type, color) VALUES (?, ?, ?)');
  const seedCategories = db.transaction(() => {
    [
      ['Salary', 'income', '#22c55e'],
      ['Freelance', 'income', '#16a34a'],
      ['Gift', 'income', '#4ade80'],
      ['Investment', 'income', '#86efac'],
      ['Other Income', 'income', '#bbf7d0'],
      ['Food & Dining', 'expense', '#ef4444'],
      ['Transport', 'expense', '#f97316'],
      ['Entertainment', 'expense', '#a855f7'],
      ['Rent', 'expense', '#dc2626'],
      ['Utilities', 'expense', '#ea580c'],
      ['Healthcare', 'expense', '#ec4899'],
      ['Shopping', 'expense', '#8b5cf6'],
      ['Education', 'expense', '#06b6d4'],
      ['Other Expense', 'expense', '#94a3b8'],
    ].forEach(([name, type, color]) => insert.run(name, type, color));
  });
  seedCategories();
}

export default db;
