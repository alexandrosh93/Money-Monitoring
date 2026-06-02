import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// ---- CATEGORIES ----

app.get('/api/categories', (req, res) => {
  const { type } = req.query;
  const stmt = type
    ? db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name')
    : db.prepare('SELECT * FROM categories ORDER BY type, name');
  res.json(type ? stmt.all(type) : stmt.all());
});

app.post('/api/categories', (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  try {
    const result = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)').run(
      name.trim(), type, color || '#6366f1'
    );
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: 'Category name already exists' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- TRANSACTIONS ----

app.get('/api/transactions', (req, res) => {
  const { type, category_id, limit = 100, offset = 0 } = req.query;
  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (type) { query += ' AND t.type = ?'; params.push(type); }
  if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
  query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json(db.prepare(query).all(...params));
});

app.post('/api/transactions', (req, res) => {
  const { amount, type, category_id, description, date } = req.body;
  if (!amount || !type || !date) return res.status(400).json({ error: 'amount, type, and date are required' });
  if (amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
  const result = db.prepare(
    'INSERT INTO transactions (amount, type, category_id, description, date) VALUES (?, ?, ?, ?, ?)'
  ).run(amount, type, category_id || null, description || null, date);
  const tx = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(tx);
});

app.delete('/api/transactions/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- SUMMARY ----

app.get('/api/summary', (req, res) => {
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'").get().total;
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'").get().total;
  const byCategory = db.prepare(`
    SELECT c.name, c.color, t.type, COALESCE(SUM(t.amount), 0) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    GROUP BY t.category_id, t.type
    ORDER BY total DESC
  `).all();
  res.json({ income, expense, balance: income - expense, byCategory });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
