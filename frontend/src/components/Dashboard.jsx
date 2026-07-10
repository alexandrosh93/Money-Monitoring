export default function Dashboard({ summary, transactions }) {
  const recent = transactions.slice(0, 5);
  const fmt = (n) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="card balance-card">
          <span className="card-label">Balance</span>
          <span className={`card-amount big ${summary.balance >= 0 ? 'income-color' : 'expense-color'}`}>
            {fmt(summary.balance)}
          </span>
        </div>
        <div className="card income-card">
          <span className="card-label">Total Income</span>
          <span className="card-amount income-color">{fmt(summary.income)}</span>
        </div>
        <div className="card expense-card">
          <span className="card-label">Total Expenses</span>
          <span className="card-amount expense-color">{fmt(summary.expense)}</span>
        </div>
      </div>

      {summary.byAccount?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Account Balances</h3>
          <div className="account-grid">
            {summary.byAccount.map(account => (
              <div key={account.id} className="account-card">
                <span className="cat-dot" style={{ background: account.color }} />
                <div className="account-card-info">
                  <span className="account-name">{account.name}</span>
                  <span className={`account-balance ${account.balance >= 0 ? 'income-color' : 'expense-color'}`}>{fmt(account.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.byCategory.length > 0 && (
        <div className="card">
          <h3 className="section-title">Spending by Category</h3>
          <div className="category-bars">
            {summary.byCategory
              .filter(c => c.type === 'expense')
              .slice(0, 6)
              .map((c, i) => {
                const max = Math.max(...summary.byCategory.filter(x => x.type === 'expense').map(x => x.total));
                const pct = max > 0 ? (c.total / max) * 100 : 0;
                return (
                  <div key={i} className="bar-item">
                    <div className="bar-label">
                      <span>{c.name || 'Uncategorized'}</span>
                      <span>{fmt(c.total)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: c.color || '#6366f1' }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Recent Transactions</h3>
        {recent.length === 0 ? (
          <p className="empty-state">No transactions yet. Add your first one!</p>
        ) : (
          <ul className="tx-list">
            {recent.map(tx => (
              <li key={tx.id} className="tx-item">
                <div className="tx-dot" style={{ background: tx.category_color || '#94a3b8' }} />
                <div className="tx-info">
                  <span className="tx-desc">{tx.description || tx.category_name || 'Transaction'}</span>
                  <span className="tx-meta">{tx.account_name || 'No account'} · {tx.category_name || 'Uncategorized'} · {tx.date}</span>
                </div>
                <span className={`tx-amount ${tx.type === 'income' ? 'income-color' : 'expense-color'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
