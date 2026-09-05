import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('student@nwu.ac.za');
  const [password, setPassword] = useState('CampusSafe123!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'CPS' ? '/security' : '/student'} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const signedIn = await login(identifier, password);
      navigate(signedIn.role === 'CPS' ? '/security' : '/student', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <div className="shield-mark">◆</div>
        <p className="eyebrow">CMPG323 • IT Developments</p>
        <h1>CampusSafe Twin</h1>
        <p className="muted">A campus safety digital twin for the NWU Potchefstroom prototype area.</p>
        <form onSubmit={submit} className="stacked-form">
          <label>Username or email
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="demo-credentials">
          <strong>Practice accounts</strong>
          <span>Student: student@nwu.ac.za</span>
          <span>CPS: security@nwu.ac.za</span>
          <span>Password: CampusSafe123!</span>
        </div>
      </section>
    </div>
  );
}
