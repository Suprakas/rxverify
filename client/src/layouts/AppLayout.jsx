import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice.js';
import useAuth from '../hooks/useAuth.js';
import usePermission from '../hooks/usePermission.js';
import Button from '../components/Button/Button.jsx';
import StatusBadge from '../components/StatusBadge/StatusBadge.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { user } = useAuth();
  const { isPatient, isPharmacist, isAdmin } = usePermission();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (isPharmacist) return '/pharmacist';
    if (isAdmin) return '/admin';
    return '/patient';
  };

  return (
    <div className="rx-app-layout">
      {/* Top Navigation Bar */}
      <header className="rx-app-header">
        <div className="rx-app-header__container">
          <div className="rx-app-header__left">
            <button
              type="button"
              className="rx-mobile-menu-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to={getDashboardPath()} className="rx-brand-link">
              <span className="rx-brand-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 4v16m-8-8h16" />
                </svg>
              </span>
              <span className="rx-brand-text">
                <span className="rx-brand-text__main">RxVerify</span>
                <span className="rx-brand-text__sub">Clinical Pharmacy Systems</span>
              </span>
            </Link>
          </div>

          <div className="rx-app-header__user">
            {user && (
              <div className="rx-user-badge-container">
                <div className="rx-user-info">
                  <span className="rx-user-name">{user.name}</span>
                  <StatusBadge variant={user.role} status={user.role} />
                </div>
                {user.licenseNumber && (
                  <span className="rx-license-label">RPh #{user.licenseNumber}</span>
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

      {/* Main Body with Sidebar + Content */}
      <div className="rx-app-body">
        {/* Sidebar */}
        <aside className={`rx-app-sidebar ${mobileSidebarOpen ? 'rx-app-sidebar--open' : ''}`}>
          <div className="rx-sidebar-section">
            <div className="rx-sidebar-role-card">
              <div className="rx-sidebar-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="rx-sidebar-user-details">
                <strong className="rx-sidebar-user-name">{user?.name}</strong>
                <span className="rx-sidebar-user-email">{user?.email}</span>
                <StatusBadge variant={user?.role} status={user?.role} />
              </div>
            </div>
          </div>

          <nav className="rx-sidebar-nav">
            <span className="rx-sidebar-heading">Navigation</span>

            {isPatient && (
              <>
                <Link
                  to="/patient"
                  className={`rx-sidebar-link ${location.pathname === '/patient' ? 'rx-sidebar-link--active' : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className="rx-sidebar-icon">💊</span>
                  <span>My Prescriptions</span>
                </Link>
              </>
            )}

            {isPharmacist && (
              <>
                <Link
                  to="/pharmacist"
                  className={`rx-sidebar-link ${location.pathname === '/pharmacist' ? 'rx-sidebar-link--active' : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className="rx-sidebar-icon">⚡</span>
                  <span>Verification Queue</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`rx-sidebar-link ${location.pathname === '/admin' ? 'rx-sidebar-link--active' : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <span className="rx-sidebar-icon">📊</span>
                  <span>Operations & Audit</span>
                </Link>
              </>
            )}

            <span className="rx-sidebar-heading" style={{ marginTop: 'var(--space-3)' }}>
              System Compliance
            </span>

            <div className="rx-sidebar-status-box">
              <div className="rx-status-row">
                <span className="rx-status-dot" />
                <span>RBAC Security Active</span>
              </div>
              <div className="rx-status-row">
                <span className="rx-status-dot" />
                <span>15m JWT / 7d Refresh</span>
              </div>
              <div className="rx-status-row">
                <span className="rx-status-dot" />
                <span>Pharmacy Board Protocol</span>
              </div>
            </div>
          </nav>
        </aside>

        {mobileSidebarOpen && (
          <div
            className="rx-sidebar-backdrop"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content Area */}
        <main className="rx-app-main">
          <div className="rx-app-main__container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="rx-app-footer">
        <div className="rx-app-footer__container">
          <p className="rx-footer-copy">
            &copy; 2026 RxVerify Pharmacy Systems. Phase 2 Role-Based Access Control (RBAC).
          </p>
          <span className="rx-footer-compliance">
            HIPAA Compliant &bull; Server Enforced Permissions &bull; Role Access Guards
          </span>
        </div>
      </footer>
    </div>
  );
}