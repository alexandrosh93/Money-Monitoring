import { useState } from 'react';
import { supabase } from '../supabase.js';
import { IconEuro } from './Icons.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError('Incorrect email or password.');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-badge"><IconEuro size={24} /></span>
        </div>
        <h1>Money Monitor</h1>
        <p className="helper-text login-subtitle">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="cat-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" required autoComplete="username"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
