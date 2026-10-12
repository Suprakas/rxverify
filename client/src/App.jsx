import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from './features/auth/authSlice.js';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import PatientDashboard from './pages/PatientDashboard/PatientDashboard.jsx';
import PharmacistDashboard from './pages/PharmacistDashboard/PharmacistDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx';
import Forbidden from './pages/Forbidden/Forbidden.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

/**
 * Helper component that navigates an authenticated user to their role-specific dashboard.
 */
function RoleBasedRedirect() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === 'pharmacist') {
    return <Navigate to="/pharmacist" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/patient" replace />;
}

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Attempt session restoration via httpOnly refresh cookie
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/403" element={<Forbidden />} />

        {/* Protected Application Area wrapped in AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Index & /dashboard automatically route to user's assigned dashboard */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<RoleBasedRedirect />} />

            {/* Patient Dashboard - Protected for 'patient' role only */}
            <Route element={<ProtectedRoute roles={['patient']} />}>
              <Route path="/patient" element={<PatientDashboard />} />
            </Route>

            {/* Pharmacist Dashboard - Protected for 'pharmacist' role only */}
            <Route element={<ProtectedRoute roles={['pharmacist']} />}>
              <Route path="/pharmacist" element={<PharmacistDashboard />} />
            </Route>

            {/* Admin Dashboard - Protected for 'admin' role only */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Catch-All Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}