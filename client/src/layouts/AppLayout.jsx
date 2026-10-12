import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice.js';
import useAuth from '../hooks/useAuth.js';
import Button from '../components/Button/Button.jsx';
import StatusBadge from '../components/StatusBadge/StatusBadge.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="rx-app-layout">
      <header className="rx-app-header">
        <div className="rx-app-header__container">
          <div className="rx-app-header__brand">
            <Link to="/dashboard" className="rx-brand-link">
              <span className="rx-brand-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 4v16m-8-8h16" />
                </svg>
              </span>
              <span className="rx-brand-text">
                <span className="rx-brand-text__main">RxVerify</span>
                <span className="rx-brand-text__sub">Pharmacy Verification</span>
              </span>
            </Link>
          </div>

          <nav className="rx-app-nav">
            <Link
              to="/dashboard"
              className={`rx-nav-link ${location.pathname === '/dashboard' ? 'rx-nav-link--active' : ''}`}
            >
              Verification Workspace
            </Link>
          </nav>

          <div className="rx-app-header__user">
            {user && (
              <div className="rx-user-badge-container">
                <div className="rx-user-info">
                  <span className="rx-user-name">{user.name}</span>
                  <StatusBadge variant={user.role} status={user.role} />
                </div>
                {user.licenseNumber && (
                  <span className="rx-license-label">Lic #{user.licenseNumber}</span>
                )}
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="rx-logout-btn"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="rx-app-main">
        <div className="rx-app-main__container">
          <Outlet />
        </div>
      </main>

      <footer className="rx-app-footer">
        <div className="rx-app-footer__container">
          <p className="rx-footer-copy">
            &copy; 2026 RxVerify Pharmacy Systems. Phase 1 Clinical Prescription Verification.
          </p>
          <span className="rx-footer-compliance">
            HIPAA Compliant &bull; 15-min JWT Access &bull; HttpOnly Cookie Refresh
          </span>
        </div>
      </footer>
    </div>
  );
}
