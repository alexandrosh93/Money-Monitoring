import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';
import Dashboard from './components/Dashboard.jsx';
import TransactionList from './components/TransactionList.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import AccountManager from './components/AccountManager.jsx';
import TransferForm from './components/TransferForm.jsx';
import { IconHome, IconList, IconWallet, IconTag, IconSwap, IconPlus, IconEuro, IconClose } from './components/Icons.jsx';

const TABS = [
  { key: 'dashboard', label: 'Home', Icon: IconHome },
  { key: 'transactions', label: 'History', Icon: IconList },
  { key: 'accounts', label: 'Accounts', Icon: IconWallet },
  { key: 'categories', label: 'Categories', Icon: IconTag },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('transaction');
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byCategory: [], byAccount: [], byPerson: [] });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: accts }, { data: txs }] = await Promise.all([
        supabase.from('money_monitor_categories').select('*').order('type').order('name'),
        supabase.from('money_monitor_accounts').select('*').order('name'),
        supabase.from('money_monitor_transactions')
          .select('*, money_monitor_categories(name, color), money_monitor_accounts(name, color)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      const normalizedTxs = (txs || []).map(t => ({
        ...t,
        category_name: t.money_monitor_categories?.name,
        category_color: t.money_monitor_categories?.color,
        account_name: t.money_monitor_accounts?.name,
        account_color: t.money_monitor_accounts?.color,
      }));

      const numericTxs = normalizedTxs.map(t => ({ ...t, amount: Number(t.amount) }));
      const realTxs = numericTxs.filter(t => !t.is_transfer);
      const income = realTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = realTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      const catMap = {};
      realTxs.forEach(t => {
        const key = `${t.category_id}-${t.type}`;
        if (!catMap[key]) catMap[key] = { name: t.category_name, color: t.category_color, type: t.type, total: 0 };
        catMap[key].total += t.amount;
      });
      const byCategory = Object.values(catMap).sort((a, b) => b.total - a.total);

      const accountMap = {};
      (accts || []).forEach(a => { accountMap[a.id] = { id: a.id, name: a.name, color: a.color, group_name: a.group_name, kind: a.kind, income: 0, expense: 0, balance: 0 }; });
      numericTxs.forEach(t => {
        const accountId = t.account_id || 'unassigned';
        if (!accountMap[accountId]) accountMap[accountId] = { id: accountId, name: t.account_name || 'Unassigned', color: t.account_color || '#94a3b8', group_name: null, kind: null, income: 0, expense: 0, balance: 0 };
        accountMap[accountId][t.type] += t.amount;
        accountMap[accountId].balance += t.type === 'income' ? t.amount : -t.amount;
      });
      const allAccounts = Object.values(accountMap);
      const byAccount = allAccounts.filter(a => !a.group_name).sort((a, b) => b.balance - a.balance);

      const personMap = {};
      allAccounts.filter(a => a.group_name).forEach(a => {
        if (!personMap[a.group_name]) personMap[a.group_name] = { name: a.group_name, cash: 0, bank: 0, total: 0 };
        if (a.kind === 'cash') personMap[a.group_name].cash += a.balance;
        if (a.kind === 'bank') personMap[a.group_name].bank += a.balance;
        personMap[a.group_name].total += a.balance;
      });
      const byPerson = Object.values(personMap).sort((a, b) => b.total - a.total);

      setCategories(cats || []);
      setAccounts(accts || []);
      setTransactions(numericTxs);
      setSummary({ income, expense, balance: income - expense, byCategory, byAccount, byPerson });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddTransaction = async (data) => {
    await supabase.from('money_monitor_transactions').insert({
      amount: data.amount,
      type: data.type,
      category_id: data.category_id || null,
      description: data.description || null,
      date: data.date,
      account_id: data.account_id || null,
    });
    setShowForm(false);
    fetchAll();
  };

  const handleAddTransfer = async (data) => {
    const fromAccount = accounts.find(a => String(a.id) === String(data.from_account_id));
    const toAccount = accounts.find(a => String(a.id) === String(data.to_account_id));
    const note = data.description || `Transfer from ${fromAccount?.name || 'account'} to ${toAccount?.name || 'account'}`;
    await supabase.from('money_monitor_transactions').insert([
      { amount: data.amount, type: 'expense', category_id: null, account_id: data.from_account_id, description: note, date: data.date, is_transfer: true },
      { amount: data.amount, type: 'income', category_id: null, account_id: data.to_account_id, description: note, date: data.date, is_transfer: true },
    ]);
    setShowForm(false);
    fetchAll();
  };

  const handleDeleteTransaction = async (id) => {
    await supabase.from('money_monitor_transactions').delete().eq('id', id);
    fetchAll();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="logo">
            <span className="logo-badge"><IconEuro size={18} /></span>
            Money Monitor
          </h1>
          <div className="header-actions">
            <button className="btn btn-ghost header-btn" onClick={() => { setFormMode('transfer'); setShowForm(true); }}>
              <IconSwap size={16} /> Transfer
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">
            <div className="skeleton" style={{ height: 96 }} />
            <div className="skeleton" style={{ height: 140 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard summary={summary} transactions={transactions} />
            )}
            {tab === 'transactions' && (
              <TransactionList
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                onDelete={handleDeleteTransaction}
                onAdd={() => { setFormMode('transaction'); setShowForm(true); }}
              />
            )}
            {tab === 'accounts' && (
              <AccountManager accounts={accounts} transactions={transactions} onRefresh={fetchAll} />
            )}
            {tab === 'categories' && (
              <CategoryManager categories={categories} onRefresh={fetchAll} />
            )}
          </>
        )}
      </main>

      <button className="fab" onClick={() => { setFormMode('transaction'); setShowForm(true); }} aria-label="Add Transaction">
        <IconPlus size={26} />
      </button>

      <nav className="tab-nav">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <span className="tab-icon"><Icon size={21} /></span>
            {label}
          </button>
        ))}
      </nav>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <h2>{formMode === 'transfer' ? 'Add Transfer' : 'Add Transaction'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)} aria-label="Close"><IconClose size={16} /></button>
            </div>
            {formMode === 'transfer' ? (
              <TransferForm accounts={accounts} onSubmit={handleAddTransfer} onCancel={() => setShowForm(false)} />
            ) : (
              <TransactionForm
                categories={categories}
                accounts={accounts}
                onSubmit={handleAddTransaction}
                onCancel={() => setShowForm(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
