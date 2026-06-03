import { useState } from 'react';
import { supabase } from '../supabase.js';

export default function CategoryManager({ categories, onRefresh }) {
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#6366f1' });
  const [error, setError] = useState('');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.from('categories').insert({
      name: form.name.trim(), type: form.type, color: form.color,
    });
    if (err) { setError(err.message); return; }
    setForm(f => ({ ...f, name: '', color: '#6366f1' }));
    onRefresh();
  };

  const handleDelete = async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    onRefresh();
  };

  const CategoryGroup = ({ title, cats, type }) => (
    <div className="card">
      <h3 className={`section-title ${type === 'income' ? 'income-color' : 'expense-color'}`}>{title}</h3>
      {cats.length === 0 ? <p className="empty-state">No categories yet.</p> : (
        <ul className="cat-list">
          {cats.map(c => (
            <li key={c.id} className="cat-item">
              <span className="cat-dot" style={{ background: c.color }} />
              <span className="cat-name">{c.name}</span>
              <button className="delete-btn" onClick={() => handleDelete(c.id)} title="Delete">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="cat-page">
      <div className="card">
        <h3 className="section-title">Add Category</h3>
        <form className="cat-form" onSubmit={handleAdd}>
          <div className="type-toggle">
            <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active-income' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income' }))}>Income</button>
            <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense' }))}>Expense</button>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Name</label>
              <input required type="text" placeholder="Category name" maxLength={50}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="color" value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className={`btn ${form.type === 'income' ? 'btn-income' : 'btn-expense'}`}>
            Add {form.type === 'income' ? 'Income' : 'Expense'} Category
          </button>
        </form>
      </div>

      <CategoryGroup title="Income Categories" cats={incomeCategories} type="income" />
      <CategoryGroup title="Expense Categories" cats={expenseCategories} type="expense" />
    </div>
  );
}
