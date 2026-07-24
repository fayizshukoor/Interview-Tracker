import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const publicLinks = [{ to: '/', label: 'Home' }];
const protectedLinks = [
  { to: '/candidates', label: 'Candidates' },
  { to: '/questions', label: 'Question Bank' },
  { to: '/reviews', label: 'New Review' },
  { to: '/history', label: 'History' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🎯</span>
          <span>Interview Tracker</span>
        </NavLink>

        <nav className="navbar-links">
          {publicLinks.map(({ to, label }) => (
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

          {user &&
            protectedLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' nav-link--active' : '')
                }
              >
                {label}
              </NavLink>
            ))}

          {user ? (
            <button
              type="button"
              className="nav-link"
              onClick={logout}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem 0.9rem', color: 'rgba(255,255,255,.85)' }}
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' nav-link--active' : '')
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' nav-link--active' : '')
                }
              >
                Register
              </NavLink>
            </>
          )}
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
