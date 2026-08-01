import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🎯</span>
          <span>Interview Tracker</span>
        </NavLink>

        <button
          type="button"
          className="navbar-toggle"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <nav className={'navbar-links' + (menuOpen ? ' navbar-links--open' : '')}>
          {publicLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link--active' : '')
              }
              onClick={() => setMenuOpen(false)}
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
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}

          {user ? (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setLogoutConfirmOpen(true); }}
              className="nav-link nav-logout"
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
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' nav-link--active' : '')
                }
                onClick={() => setMenuOpen(false)}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>

      {logoutConfirmOpen && (
        <div
          className="confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogoutConfirmOpen(false);
          }}
        >
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <div className="confirm-icon">↪</div>
            <h2 id="logout-title">Log out?</h2>
            <p>You will need to sign in again to access your interview tracker.</p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setLogoutConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger-solid" onClick={() => { setLogoutConfirmOpen(false); logout(); }}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="footer">
        <span>Interview Tracker © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
