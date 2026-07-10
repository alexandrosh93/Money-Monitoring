import { IconArrowUp, IconArrowDown, IconSwap, IconClose, IconEmpty } from './Icons.jsx';

export default function AccountStatement({ account, transactions, onClose }) {
  const fmt = (n) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n);

  const accountTxs = transactions.filter(t => t.account_id === account.id);
  const ascending = [...accountTxs].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
  });

  let running = 0;
  const withBalance = ascending.map(t => {
    running += t.type === 'income' ? t.amount : -t.amount;
    return { ...t, balanceAfter: running };
  });
  const balance = running;
  const movements = [...withBalance].reverse();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal statement-modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <h2>
            <span className="cat-dot" style={{ background: account.color, marginRight: '0.5rem' }} />
            {account.name}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><IconClose size={16} /></button>
        </div>

        <div className="statement-balance">
          <span className="card-label">Current Balance</span>
          <span className={`card-amount big ${balance >= 0 ? 'income-color' : 'expense-color'}`}>{fmt(balance)}</span>
        </div>

        <h3 className="section-title" style={{ marginTop: '1.125rem' }}>Movements</h3>
        {movements.length === 0 ? (
          <div className="empty-card" style={{ padding: '1rem 0' }}>
            <span className="empty-icon"><IconEmpty /></span>
            <p className="empty-state" style={{ padding: 0 }}>No movements yet for this account.</p>
          </div>
        ) : (
          <ul className="tx-list statement-list">
            {movements.map(tx => (
              <li key={tx.id} className="tx-item">
                <span className={`tx-icon ${tx.is_transfer ? 'transfer' : tx.type}`}>
                  {tx.is_transfer ? <IconSwap size={16} /> : tx.type === 'income' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                </span>
                <div className="tx-info">
                  <span className="tx-desc">{tx.description || tx.category_name || 'Transaction'}</span>
                  <span className="tx-meta">{tx.is_transfer ? 'Transfer' : (tx.category_name || 'Uncategorized')} · {tx.date}</span>
                </div>
                <div className="statement-amounts">
                  <span className={`tx-amount ${tx.is_transfer ? 'transfer-color' : (tx.type === 'income' ? 'income-color' : 'expense-color')}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                  <span className="statement-running">{fmt(tx.balanceAfter)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
