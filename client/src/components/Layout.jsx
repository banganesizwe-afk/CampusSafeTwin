import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const links = user?.role === 'CPS'
    ? [['/security', 'Dashboard'], ['/security/analytics', 'Analytics']]
    : [['/student', 'Campus Map'], ['/student/report', 'Report'], ['/student/reports', 'My Reports'], ['/student/route', 'Safer Route']];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">CampusSafe Twin</div>
          <div className="brand-subtitle">NWU Potchefstroom academic prototype</div>
        </div>
        <div className="account-strip">
          <span>{user?.display_name ?? user?.name}</span>
          <span className="role-pill">{user?.role === 'CPS' ? 'Campus Protection Services' : 'Student'}</span>
          <button className="button ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      <nav className="nav-tabs" aria-label="Primary navigation">
        {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/security' || to === '/student'}>{label}</NavLink>)}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
