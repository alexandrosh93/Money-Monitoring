import { useState } from 'react';
import { IconArrowUp, IconArrowDown, IconSwap, IconChevronRight, IconCash, IconBank, IconEmpty } from './Icons.jsx';
import AccountStatement from './AccountStatement.jsx';

export default function Dashboard({ summary, transactions }) {
  const recent = transactions.slice(0, 5);
  const fmt = (n) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n);
  const [statementTarget, setStatementTarget] = useState(null);

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="card balance-card">
          <span className="card-label">Total Balance</span>
          <span className="card-amount big">{fmt(summary.balance)}</span>
        </div>
        <div className="card mini-card">
          <span className="mini-icon income"><IconArrowUp size={17} /></span>
          <div className="mini-card-body">
            <span className="card-label">Income</span>
            <span className="card-amount income-color">{fmt(summary.income)}</span>
          </div>
        </div>
        <div className="card mini-card">
          <span className="mini-icon expense"><IconArrowDown size={17} /></span>
          <div className="mini-card-body">
            <span className="card-label">Expenses</span>
            <span className="card-amount expense-color">{fmt(summary.expense)}</span>
          </div>
        </div>
      </div>

      <div className="cashbank-row">
        <div className="card mini-card">
          <span className="mini-icon cash"><IconCash size={17} /></span>
          <div className="mini-card-body">
            <span className="card-label">Total Cash</span>
            <span className="card-amount cash-color">{fmt(summary.totalCash)}</span>
          </div>
        </div>
        <div className="card mini-card">
          <span className="mini-icon bank"><IconBank size={17} /></span>
          <div className="mini-card-body">
            <span className="card-label">Total Bank</span>
            <span className="card-amount bank-color">{fmt(summary.totalBank)}</span>
          </div>
        </div>
      </div>

      {summary.byPerson?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Balances by Person</h3>
          <p className="helper-text">Tap a person to see their combined Cash + Bank movements.</p>
          <div className="person-grid">
            {summary.byPerson.map(person => (
              <div
                key={person.name}
                className="person-card clickable"
                onClick={() => setStatementTarget({ title: person.name, color: 'var(--primary)', accountIds: person.accountIds })}
              >
                <div className="person-header">
                  <span className="person-name">
                    <span className="person-avatar" style={{ background: `linear-gradient(135deg, var(--primary), var(--primary-dark))` }}>
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                    {person.name}
                  </span>
                  <span className={`person-total ${person.total >= 0 ? 'income-color' : 'expense-color'}`}>{fmt(person.total)}</span>
                </div>
                <div className="person-breakdown">
                  <span>Cash: <strong>{fmt(person.cash)}</strong></span>
                  <span>Bank: <strong>{fmt(person.bank)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.byAccount?.length > 0 && (
        <div className="card">
          <h3 className="section-title">Account Balances</h3>
          <div className="account-grid">
            {summary.byAccount.map(account => (
              <div
                key={account.id}
                className="account-card clickable"
                onClick={() => setStatementTarget({ title: account.name, color: account.color, accountIds: [account.id] })}
              >
                <span className="cat-dot" style={{ background: account.color }} />
                <div className="account-card-info">
                  <span className="account-name">{account.name}</span>
                  <span className={`account-balance ${account.balance >= 0 ? 'income-color' : 'expense-color'}`}>{fmt(account.balance)}</span>
                </div>
                <IconChevronRight size={16} />
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
          <div className="empty-card" style={{ padding: '1rem 0' }}>
            <span className="empty-icon"><IconEmpty /></span>
            <p className="empty-state" style={{ padding: 0 }}>No transactions yet. Add your first one!</p>
          </div>
        ) : (
          <ul className="tx-list">
            {recent.map(tx => (
              <li key={tx.id} className="tx-item">
                <span className={`tx-icon ${tx.is_transfer ? 'transfer' : tx.type}`}>
                  {tx.is_transfer ? <IconSwap size={16} /> : tx.type === 'income' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                </span>
                <div className="tx-info">
                  <span className="tx-desc">{tx.description || tx.category_name || 'Transaction'}</span>
                  <span className="tx-meta">{tx.account_name || 'No account'} · {tx.is_transfer ? 'Transfer' : (tx.category_name || 'Uncategorized')} · {tx.date}</span>
                </div>
                <span className={`tx-amount ${tx.is_transfer ? 'transfer-color' : (tx.type === 'income' ? 'income-color' : 'expense-color')}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {statementTarget && (
        <AccountStatement
          title={statementTarget.title}
          color={statementTarget.color}
          accountIds={statementTarget.accountIds}
          transactions={transactions}
          onClose={() => setStatementTarget(null)}
        />
      )}
    </div>
  );
}
