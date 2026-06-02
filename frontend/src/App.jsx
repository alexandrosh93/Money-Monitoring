import { useState, useEffect, useCallback } from 'react';
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
      const [sumRes, txRes, catRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions'),
        fetch('/api/categories'),
      ]);
      setSummary(await sumRes.json());
      setTransactions(await txRes.json());
      setCategories(await catRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddTransaction = async (data) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    fetchAll();
  };

  const handleDeleteTransaction = async (id) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="logo">💰 Money Monitor</h1>
          <button className="btn btn-primary add-btn" onClick={() => setShowForm(true)}>
            + Add Transaction
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
