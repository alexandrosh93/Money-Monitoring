import { useState } from 'react';

export default function ConfirmDelete({ title, message, onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);

  const confirm = () => {
    if (password === '1993') {
      onConfirm();
    } else {
      setPwError(true);
      setPassword('');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pw-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          autoFocus
          onChange={e => { setPassword(e.target.value); setPwError(false); }}
          onKeyDown={e => e.key === 'Enter' && confirm()}
        />
        {pwError && <p className="error-msg">Incorrect password</p>}
        <div className="pw-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-expense" onClick={confirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
