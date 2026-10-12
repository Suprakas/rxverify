import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import Spinner from './Spinner/Spinner.jsx';

/**
 * Route guard component enforcing authentication and RBAC roles.
 * @param {Object} props
 * @param {Array<string>} [props.roles] - Array of allowed roles (e.g. ['pharmacist'])
 * @param {Array<string>} [props.allowedRoles] - Alias for roles
 */
export default function ProtectedRoute({ roles, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const requiredRoles = roles || allowedRoles;

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user?.role);
    if (!hasRequiredRole) {
      return <Navigate to="/403" state={{ deniedRole: user?.role, requiredRoles }} replace />;
    }
  }

  return <Outlet />;
}