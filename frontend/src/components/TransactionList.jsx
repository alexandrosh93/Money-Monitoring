import { useState } from 'react';

export default function TransactionList({ transactions, categories, onDelete, onAdd }) {
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('');
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (catFilter && String(tx.category_id) !== catFilter) return false;
    return true;
  });

  return (
    <div className="tx-page">
      <div className="filter-bar">
        <div className="filter-group">
          {['all', 'income', 'expense'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select className="cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories
            .filter(c => filter === 'all' || c.type === filter)
            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-card">
          <p className="empty-state">No transactions found.</p>
          <button className="btn btn-primary" onClick={onAdd}>+ Add Transaction</button>
        </div>
      ) : (
        <ul className="tx-list card">
          {filtered.map(tx => (
            <li key={tx.id} className="tx-item">
              <div className="tx-dot" style={{ background: tx.category_color || '#94a3b8' }} />
              <div className="tx-info">
                <span className="tx-desc">{tx.description || tx.category_name || 'Transaction'}</span>
                <span className="tx-meta">{tx.category_name || 'Uncategorized'} · {tx.date}</span>
              </div>
              <div className="tx-right">
                <span className={`tx-amount ${tx.type === 'income' ? 'income-color' : 'expense-color'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <button className="delete-btn" onClick={() => onDelete(tx.id)} title="Delete">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
