import { useState } from 'react';

export default function TransferForm({ accounts, onSubmit, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ amount: '', from_account_id: '', to_account_id: '', description: '', date: today });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Amount</label>
        <input type="number" min="0.01" step="0.01" placeholder="0.00" required
          value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>From Account</label>
        <select required value={form.from_account_id} onChange={e => setForm(f => ({ ...f, from_account_id: e.target.value }))}>
          <option value="">-- Select source --</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>To Account</label>
        <select required value={form.to_account_id} onChange={e => setForm(f => ({ ...f, to_account_id: e.target.value }))}>
          <option value="">-- Select destination --</option>
          {accounts.filter(a => String(a.id) !== form.from_account_id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input type="text" placeholder="Optional note..." maxLength={200}
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Add Transfer</button>
      </div>
    </form>
  );
}
