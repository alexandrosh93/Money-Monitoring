import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function AccountManager({ accounts, onRefresh }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error: err } = await supabase.from('money_monitor_accounts').insert({ name: trimmed, color });
    if (err) { setError(err.message); return; }
    setName('');
    setColor('#2563eb');
    onRefresh();
  };

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from('money_monitor_accounts').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    onRefresh();
  };

  return (
    <div className="account-page">
      <div className="card">
        <h3 className="section-title">Add Account</h3>
        <p className="helper-text">Use accounts for the Main Pool, Anna, Stelios, Alexandros, or any other money pool.</p>
        <form className="cat-form" onSubmit={handleAdd}>
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
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary">Add Account</button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Accounts</h3>
        {accounts.length === 0 ? <p className="empty-state">No accounts yet.</p> : (
          <ul className="cat-list">
            {accounts.map(account => (
              <li key={account.id} className="cat-item">
                <span className="cat-dot" style={{ background: account.color }} />
                <span className="cat-name">{account.name}</span>
                <button className="delete-btn" onClick={() => handleDelete(account.id)} title="Delete">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
