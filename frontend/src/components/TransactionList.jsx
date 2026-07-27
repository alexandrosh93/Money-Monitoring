import { useState } from 'react';
import { IconArrowUp, IconArrowDown, IconSwap, IconTrash, IconEmpty } from './Icons.jsx';
import ConfirmDelete from './ConfirmDelete.jsx';

export default function TransactionList({ transactions, categories, accounts, onDelete, onAdd }) {
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fmt = (n) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n);

  const filtered = transactions.filter(tx => {
    if (filter === 'income' && (tx.type !== 'income' || tx.is_transfer)) return false;
    if (filter === 'expense' && (tx.type !== 'expense' || tx.is_transfer)) return false;
    if (filter === 'transfer' && !tx.is_transfer) return false;
    if (catFilter && String(tx.category_id) !== catFilter) return false;
    if (accountFilter && String(tx.account_id) !== accountFilter) return false;
    return true;
  });

  return (
    <div className="tx-page">
      <div className="filter-bar">
        <div className="filter-group">
          {['all', 'income', 'expense', 'transfer'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          <select className="cat-select" value={accountFilter} onChange={e => setAccountFilter(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories
              .filter(c => filter === 'all' || c.type === filter)
              .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-card">
          <span className="empty-icon"><IconEmpty /></span>
          <p className="empty-state" style={{ padding: 0 }}>No transactions found.</p>
          <button className="btn btn-primary" onClick={onAdd}>+ Add Transaction</button>
        </div>
      ) : (
        <ul className="tx-list card">
          {filtered.map(tx => (
            <li key={tx.id} className="tx-item">
              <span className={`tx-icon ${tx.is_transfer ? 'transfer' : tx.type}`}>
                {tx.is_transfer ? <IconSwap size={16} /> : tx.type === 'income' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
              </span>
              <div className="tx-info">
                <span className="tx-desc">{tx.description || tx.category_name || 'Transaction'}</span>
                <span className="tx-meta">{tx.account_name || 'No account'} · {tx.is_transfer ? 'Transfer' : (tx.category_name || 'Uncategorized')} · {tx.date}</span>
              </div>
              <div className="tx-right">
                <span className={`tx-amount ${tx.is_transfer ? 'transfer-color' : (tx.type === 'income' ? 'income-color' : 'expense-color')}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <button className="delete-btn" onClick={() => setDeleteTarget(tx.id)} title="Delete" aria-label="Delete">
                  <IconTrash size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget !== null && (
        <ConfirmDelete
          title="Delete Transaction"
          message="Enter your password to confirm deletion."
          onConfirm={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
