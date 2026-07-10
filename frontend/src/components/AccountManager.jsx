import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function AccountManager({ accounts, onRefresh }) {
  const [isPersonAccount, setIsPersonAccount] = useState(false);
  const [name, setName] = useState('');
  const [personName, setPersonName] = useState('');
  const [kind, setKind] = useState('cash');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setPersonName('');
    setKind('cash');
    setColor('#2563eb');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    const payload = isPersonAccount
      ? {
          name: `${personName.trim()} - ${kind === 'cash' ? 'Cash' : 'Bank'}`,
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
    if (err) { setError(err.message); return; }
    onRefresh();
  };

  const standalone = accounts.filter(a => !a.group_name);
  const grouped = accounts.filter(a => a.group_name).reduce((acc, a) => {
    (acc[a.group_name] = acc[a.group_name] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="account-page">
      <div className="card">
        <h3 className="section-title">Add Account</h3>
        <p className="helper-text">Use a standalone account for pools like Main Pool, or a person sub-account (Cash / Bank) for Anna, Stelios, Alexandros, etc.</p>
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
        <h3 className="section-title">Accounts</h3>
        {accounts.length === 0 ? <p className="empty-state">No accounts yet.</p> : (
          <>
            {standalone.length > 0 && (
              <ul className="cat-list">
                {standalone.map(account => (
                  <li key={account.id} className="cat-item">
                    <span className="cat-dot" style={{ background: account.color }} />
                    <span className="cat-name">{account.name}</span>
                    <button className="delete-btn" onClick={() => handleDelete(account.id)} title="Delete">✕</button>
                  </li>
                ))}
              </ul>
            )}
            {Object.entries(grouped).map(([person, accts]) => (
              <div key={person} className="account-group">
                <h4 className="account-group-title">{person}</h4>
                <ul className="cat-list">
                  {accts.map(account => (
                    <li key={account.id} className="cat-item">
                      <span className="cat-dot" style={{ background: account.color }} />
                      <span className="cat-name">{account.kind === 'cash' ? 'Cash' : 'Bank'}</span>
                      <button className="delete-btn" onClick={() => handleDelete(account.id)} title="Delete">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
