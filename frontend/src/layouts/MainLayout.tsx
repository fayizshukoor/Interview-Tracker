import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/',         label: 'Home' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/questions',  label: 'Question Bank' },
  { to: '/reviews',    label: 'New Review' },
  { to: '/history',    label: 'History' },
];

export default function MainLayout() {
  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🎯</span>
          <span>Interview Tracker</span>
        </NavLink>
        <nav className="navbar-links">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link--active' : '')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="footer">
        <span>Interview Tracker © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
