import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Spinner from './Spinner/Spinner.jsx';
import Alert from './Alert/Alert.jsx';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ maxWidth: '600px', margin: '48px auto', padding: '0 16px' }}>
        <Alert
          variant="danger"
          title="Access Restricted"
        >
          You do not have the required permissions ({user?.role}) to view this area.
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
