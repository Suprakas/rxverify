import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Button from '../../components/Button/Button.jsx';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleReturn = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    switch (user?.role) {
      case 'pharmacist':
        navigate('/pharmacist');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'patient':
        navigate('/patient');
        break;
      default:
        navigate('/login');
        break;
    }
  };

  return (
    <div className="rx-notfound-page">
      <div className="rx-notfound-card">
        <div className="rx-notfound-badge">404</div>
        <h1 className="rx-notfound-title">Page Not Found</h1>
        <p className="rx-notfound-desc">
          The prescription verification route or clinical page you requested does not exist or has been moved.
        </p>

        <div className="rx-notfound-actions">
          <Button variant="primary" onClick={handleReturn}>
            {isAuthenticated ? 'Go to My Dashboard' : 'Return to Login'}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
