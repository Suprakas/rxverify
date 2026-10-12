import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Button from '../../components/Button/Button.jsx';
import StatusBadge from '../../components/StatusBadge/StatusBadge.jsx';
import './Forbidden.css';

export default function Forbidden() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getDashboardPath = (role) => {
    switch (role) {
      case 'pharmacist':
        return '/pharmacist';
      case 'admin':
        return '/admin';
      case 'patient':
        return '/patient';
      default:
        return '/login';
    }
  };

  const handleGoHome = () => {
    navigate(getDashboardPath(user?.role));
  };

  return (
    <div className="rx-error-page">
      <div className="rx-error-card">
        <div className="rx-error-badge">403</div>
        <h1 className="rx-error-title">Access Forbidden</h1>
        <p className="rx-error-desc">
          You do not have the required clinical or administrative role permissions to view this resource.
        </p>

        {user && (
          <div className="rx-error-user-box">
            <span className="rx-error-user-label">Current Session:</span>
            <div className="rx-error-user-details">
              <strong>{user.name}</strong>
              <StatusBadge variant={user.role} status={user.role} />
            </div>
          </div>
        )}

        <div className="rx-error-actions">
          <Button variant="primary" onClick={handleGoHome}>
            Return to My Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
