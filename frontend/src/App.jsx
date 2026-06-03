import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';
import Dashboard from './components/Dashboard.jsx';
import TransactionList from './components/TransactionList.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import CategoryManager from './components/CategoryManager.jsx';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byCategory: [] });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: txs }] = await Promise.all([
        supabase.from('categories').select('*').order('type').order('name'),
        supabase.from('transactions')
          .select('*, categories(name, color)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      const normalizedTxs = (txs || []).map(t => ({
        ...t,
        category_name: t.categories?.name,
        category_color: t.categories?.color,
      }));

      const income = normalizedTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = normalizedTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      const catMap = {};
      normalizedTxs.forEach(t => {
        const key = `${t.category_id}-${t.type}`;
        if (!catMap[key]) catMap[key] = { name: t.category_name, color: t.category_color, type: t.type, total: 0 };
        catMap[key].total += t.amount;
      });
      const byCategory = Object.values(catMap).sort((a, b) => b.total - a.total);

      setCategories(cats || []);
      setTransactions(normalizedTxs);
      setSummary({ income, expense, balance: income - expense, byCategory });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddTransaction = async (data) => {
    await supabase.from('transactions').insert({
      amount: data.amount,
      type: data.type,
      category_id: data.category_id || null,
      description: data.description || null,
      date: data.date,
    });
    setShowForm(false);
    fetchAll();
  };

  const handleDeleteTransaction = async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    fetchAll();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="logo">€ Money Monitor</h1>
          <button className="btn btn-primary add-btn" onClick={() => setShowForm(true)}>
            + Add
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'transactions', label: 'Transactions' },
          { key: 'categories', label: 'Categories' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard summary={summary} transactions={transactions} />
            )}
            {tab === 'transactions' && (
              <TransactionList
                transactions={transactions}
                categories={categories}
                onDelete={handleDeleteTransaction}
                onAdd={() => setShowForm(true)}
              />
            )}
            {tab === 'categories' && (
              <CategoryManager categories={categories} onRefresh={fetchAll} />
            )}
          </>
        )}
      </main>

      <button className="fab" onClick={() => setShowForm(true)} aria-label="Add Transaction">+</button>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Add Transaction</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <TransactionForm
              categories={categories}
              onSubmit={handleAddTransaction}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
