import { useState } from 'react';
import { supabase } from '../supabase.js';
import { IconTrash, IconChevronRight, IconDownload } from './Icons.jsx';
import AccountStatement from './AccountStatement.jsx';
import ConfirmDelete from './ConfirmDelete.jsx';

export default function AccountManager({ accounts, transactions, onRefresh, onExport }) {
  const [isPersonAccount, setIsPersonAccount] = useState(false);
  const [name, setName] = useState('');
  const [personName, setPersonName] = useState('');
  const [kind, setKind] = useState('cash');
  const [bankName, setBankName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fmt = (n) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n);
  const balanceFor = (accountId) =>
    transactions
      .filter(t => t.account_id === accountId)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  const resetForm = () => {
    setName('');
    setPersonName('');
    setKind('cash');
    setBankName('');
    setColor('#2563eb');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    const subLabel = kind === 'cash' ? 'Cash' : (bankName.trim() || 'Bank');
    const payload = isPersonAccount
      ? {
          name: `${personName.trim()} - ${subLabel}`,
          color,
          group_name: personName.trim(),
          kind,
        }
      : { name: name.trim(), color, group_name: null, kind: null };

    if (!payload.name || (isPersonAccount && !personName.trim())) return;

    const { error: err } = await supabase.from('money_monitor_accounts').insert(payload);
    if (err) { setError(err.message); return; }
    resetForm();
    onRefresh();
  };

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from('money_monitor_accounts').delete().eq('id', id);
    setDeleteTarget(null);
    if (err) { setError(err.message); return; }
    onRefresh();
  };

  const standalone = accounts.filter(a => !a.group_name);
  const grouped = accounts.filter(a => a.group_name).reduce((acc, a) => {
    (acc[a.group_name] = acc[a.group_name] || []).push(a);
    return acc;
  }, {});

  const AccountRow = ({ account, label }) => (
    <li className="cat-item account-row" onClick={() => setSelectedAccount(account)}>
      <span className="cat-dot" style={{ background: account.color }} />
      <span className="cat-name">{label}</span>
      <span className={`account-balance-mini ${balanceFor(account.id) >= 0 ? 'income-color' : 'expense-color'}`}>
        {fmt(balanceFor(account.id))}
      </span>
      <span className="account-row-chevron"><IconChevronRight size={16} /></span>
      <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteTarget(account); }} title="Delete" aria-label="Delete">
        <IconTrash size={15} />
      </button>
    </li>
  );

  return (
    <div className="account-page">
      <div className="card">
        <h3 className="section-title">Add Account</h3>
        <p className="helper-text">Use a standalone account for pools like Main Pool, or a person sub-account (Cash, or Bank with an optional bank name like "Bank of Cyprus") for Anna, Stelios, Alexandros, etc. Add multiple Bank sub-accounts per person to track different banks separately.</p>
        <form className="cat-form" onSubmit={handleAdd}>
          <div className="type-toggle">
            <button type="button" className={`toggle-btn ${!isPersonAccount ? 'active-income' : ''}`}
              onClick={() => setIsPersonAccount(false)}>Standalone</button>
            <button type="button" className={`toggle-btn ${isPersonAccount ? 'active-income' : ''}`}
              onClick={() => setIsPersonAccount(true)}>Person Sub-account</button>
          </div>

          {isPersonAccount ? (
            <>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Person Name</label>
                  <input required type="text" placeholder="e.g. Anna" maxLength={50}
                    value={personName} onChange={e => setPersonName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Type</label>
                <div className="type-toggle">
                  <button type="button" className={`toggle-btn ${kind === 'cash' ? 'active-income' : ''}`}
                    onClick={() => setKind('cash')}>Cash</button>
                  <button type="button" className={`toggle-btn ${kind === 'bank' ? 'active-income' : ''}`}
                    onClick={() => setKind('bank')}>Bank</button>
                </div>
              </div>
              {kind === 'bank' && (
                <div className="form-group">
                  <label>Bank Name (optional)</label>
                  <input type="text" placeholder="e.g. Bank of Cyprus, Eurobank" maxLength={50}
                    value={bankName} onChange={e => setBankName(e.target.value)} />
                </div>
              )}
            </>
          ) : (
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Name</label>
                <input required type="text" placeholder="Account name" maxLength={50}
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              </div>
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Add Account</button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Backup</h3>
        <p className="helper-text">Download all your accounts, categories, and transactions as a JSON file — a personal backup you control, kept safe on your own device.</p>
        <button className="btn btn-primary" onClick={onExport}>
          <IconDownload size={16} /> Export Data (JSON)
        </button>
      </div>

      <div className="card">
        <h3 className="section-title">Accounts</h3>
        <p className="helper-text">Tap an account to see its statement and running balance.</p>
        {accounts.length === 0 ? <p className="empty-state">No accounts yet.</p> : (
          <>
            {standalone.length > 0 && (
              <ul className="cat-list">
                {standalone.map(account => (
                  <AccountRow key={account.id} account={account} label={account.name} />
                ))}
              </ul>
            )}
            {Object.entries(grouped).map(([person, accts]) => (
              <div key={person} className="account-group">
                <h4 className="account-group-title">{person}</h4>
                <ul className="cat-list">
                  {accts.map(account => (
                    <AccountRow key={account.id} account={account} label={account.name.split(' - ').slice(1).join(' - ') || account.name} />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>

      {selectedAccount && (
        <AccountStatement
          title={selectedAccount.name}
          color={selectedAccount.color}
          accountIds={[selectedAccount.id]}
          transactions={transactions}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          title="Delete Account"
          message={`Enter your password to delete "${deleteTarget.name}". This only works if it has no transactions — otherwise it's blocked to protect your history.`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
