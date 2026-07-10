import { useState, useEffect } from 'react';

export default function TransactionForm({ categories, accounts, onSubmit, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ amount: '', type: 'expense', category_id: '', account_id: '', description: '', date: today });
  const filtered = categories.filter(c => c.type === form.type);

  useEffect(() => {
    setForm(f => ({ ...f, category_id: '' }));
  }, [form.type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount), category_id: form.category_id || null, account_id: form.account_id || null });
  };

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active-income' : ''}`}
          onClick={() => setForm(f => ({ ...f, type: 'income' }))}>Income</button>
        <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
          onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>Expense</button>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input type="number" min="0.01" step="0.01" placeholder="0.00" required
          value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>Account</label>
        <select required value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}>
          <option value="">-- Select account --</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Category</label>
        <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
          <option value="">-- Select category --</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input type="text" placeholder="Optional note..." maxLength={200}
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input type="date" required value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className={`btn ${form.type === 'income' ? 'btn-income' : 'btn-expense'}`}>
          Add {form.type === 'income' ? 'Income' : 'Expense'}
        </button>
      </div>
    </form>
  );
}
