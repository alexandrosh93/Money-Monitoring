import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';
import Dashboard from './components/Dashboard.jsx';
import TransactionList from './components/TransactionList.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import CategoryManager from './components/CategoryManager.jsx';
import AccountManager from './components/AccountManager.jsx';
import TransferForm from './components/TransferForm.jsx';
import Login from './components/Login.jsx';
import { IconHome, IconList, IconWallet, IconTag, IconSwap, IconPlus, IconEuro, IconClose, IconLogout, IconSun, IconMoon } from './components/Icons.jsx';

const LEFT_TABS = [
  { key: 'dashboard', label: 'Home', Icon: IconHome },
  { key: 'transactions', label: 'History', Icon: IconList },
];
const RIGHT_TABS = [
  { key: 'accounts', label: 'Accounts', Icon: IconWallet },
  { key: 'categories', label: 'Categories', Icon: IconTag },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [formMode, setFormMode] = useState('transaction');
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byAccount: [], byPerson: [], totalCash: 0, totalBank: 0 });
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
        if (!personMap[a.group_name]) personMap[a.group_name] = { name: a.group_name, cash: 0, bank: 0, total: 0, accountIds: [] };
        if (a.kind === 'cash') personMap[a.group_name].cash += a.balance;
        if (a.kind === 'bank') personMap[a.group_name].bank += a.balance;
        personMap[a.group_name].total += a.balance;
        personMap[a.group_name].accountIds.push(a.id);
      });
      const byPerson = Object.values(personMap).sort((a, b) => b.total - a.total);

      // Standalone accounts (e.g. Main Pool) count entirely as cash
      const totalCash = byAccount.reduce((s, a) => s + a.balance, 0) + byPerson.reduce((s, p) => s + p.cash, 0);
      const totalBank = byPerson.reduce((s, p) => s + p.bank, 0);

      setCategories(cats || []);
      setAccounts(accts || []);
      setTransactions(numericTxs);
      setSummary({ income, expense, balance: income - expense, byAccount, byPerson, totalCash, totalBank });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (session) fetchAll(); }, [session, fetchAll]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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

  const handleExportData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      accounts,
      categories,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-monitor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (session === undefined) {
    return <div className="auth-check" />;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="logo">
            <span className="logo-badge"><IconEuro size={18} /></span>
            Money Monitor
          </h1>
          <div className="header-actions">
            <button className="btn btn-ghost header-icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle light/dark">
              {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <button className="btn header-icon-btn header-signout-btn" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              <IconLogout size={16} />
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
              <Dashboard summary={summary} transactions={transactions} accounts={accounts} />
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
              <AccountManager accounts={accounts} transactions={transactions} onRefresh={fetchAll} onExport={handleExportData} />
            )}
            {tab === 'categories' && (
              <CategoryManager categories={categories} onRefresh={fetchAll} />
            )}
          </>
        )}
      </main>

      <nav className="tab-nav">
        {LEFT_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            <span className="tab-icon"><Icon size={21} /></span>
            {label}
          </button>
        ))}

        <button className="nav-fab" onClick={() => setShowActionMenu(true)} aria-label="Quick add">
          <IconPlus size={24} />
        </button>

        {RIGHT_TABS.map(({ key, label, Icon }) => (
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

      {showActionMenu && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowActionMenu(false)}>
          <div className="modal action-menu">
            <div className="modal-handle" />
            <div className="modal-header">
              <h2>Quick Add</h2>
              <button className="close-btn" onClick={() => setShowActionMenu(false)} aria-label="Close"><IconClose size={16} /></button>
            </div>
            <div className="action-menu-grid">
              <button
                className="action-menu-item"
                onClick={() => { setFormMode('transaction'); setShowForm(true); setShowActionMenu(false); }}
              >
                <span className="action-menu-icon transaction"><IconPlus size={22} /></span>
                <span>Add Income or Expense</span>
              </button>
              <button
                className="action-menu-item"
                onClick={() => { setFormMode('transfer'); setShowForm(true); setShowActionMenu(false); }}
              >
                <span className="action-menu-icon transfer"><IconSwap size={22} /></span>
                <span>Add Transfer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <h2>{formMode === 'transfer' ? 'Add Transfer' : 'Add Income or Expense'}</h2>
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
