import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// ---- ACCOUNTS ----

app.get('/api/accounts', (req, res) => {
  res.json(db.prepare('SELECT * FROM money_monitor_accounts ORDER BY name').all());
});

app.post('/api/accounts', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare('INSERT INTO money_monitor_accounts (name, color) VALUES (?, ?)').run(name.trim(), color || '#2563eb');
    res.status(201).json(db.prepare('SELECT * FROM money_monitor_accounts WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Account name already exists' });
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  db.prepare('DELETE FROM money_monitor_accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- CATEGORIES ----

app.get('/api/categories', (req, res) => {
  const { type } = req.query;
  const stmt = type
    ? db.prepare('SELECT * FROM money_monitor_categories WHERE type = ? ORDER BY name')
    : db.prepare('SELECT * FROM money_monitor_categories ORDER BY type, name');
  res.json(type ? stmt.all(type) : stmt.all());
});

app.post('/api/categories', (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  try {
    const result = db.prepare('INSERT INTO money_monitor_categories (name, type, color) VALUES (?, ?, ?)').run(
      name.trim(), type, color || '#6366f1'
    );
    res.status(201).json(db.prepare('SELECT * FROM money_monitor_categories WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Category name already exists' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM money_monitor_categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- TRANSACTIONS ----

app.get('/api/transactions', (req, res) => {
  const { type, category_id, account_id, limit = 100, offset = 0 } = req.query;
  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color, a.name as account_name, a.color as account_color
    FROM money_monitor_transactions t
    LEFT JOIN money_monitor_categories c ON t.category_id = c.id
    LEFT JOIN money_monitor_accounts a ON t.account_id = a.id
    WHERE 1=1
  `;
  const params = [];
  if (type) { query += ' AND t.type = ?'; params.push(type); }
  if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
  if (account_id) { query += ' AND t.account_id = ?'; params.push(account_id); }
  query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json(db.prepare(query).all(...params));
});

app.post('/api/transactions', (req, res) => {
  const { amount, type, category_id, account_id, description, date } = req.body;
  if (!amount || !type || !date) return res.status(400).json({ error: 'amount, type, and date are required' });
  if (amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
  const result = db.prepare(
    'INSERT INTO money_monitor_transactions (amount, type, category_id, account_id, description, date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(amount, type, category_id || null, account_id || null, description || null, date);
  const tx = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, a.name as account_name, a.color as account_color
    FROM money_monitor_transactions t LEFT JOIN money_monitor_categories c ON t.category_id = c.id LEFT JOIN money_monitor_accounts a ON t.account_id = a.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(tx);
});

app.delete('/api/transactions/:id', (req, res) => {
  db.prepare('DELETE FROM money_monitor_transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- SUMMARY ----

app.get('/api/summary', (req, res) => {
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM money_monitor_transactions WHERE type = 'income'").get().total;
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM money_monitor_transactions WHERE type = 'expense'").get().total;
  const byAccount = db.prepare(`
    SELECT a.id, COALESCE(a.name, 'Unassigned') as name, COALESCE(a.color, '#94a3b8') as color,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expense,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
    FROM money_monitor_accounts a
    LEFT JOIN money_monitor_transactions t ON t.account_id = a.id
    GROUP BY a.id
    ORDER BY balance DESC
  `).all();
  const byCategory = db.prepare(`
    SELECT c.name, c.color, t.type, COALESCE(SUM(t.amount), 0) as total
    FROM money_monitor_transactions t
    LEFT JOIN money_monitor_categories c ON t.category_id = c.id
    GROUP BY t.category_id, t.type
    ORDER BY total DESC
  `).all();
  res.json({ income, expense, balance: income - expense, byCategory, byAccount });
});

// Serve built frontend in production
const frontendDist = join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
