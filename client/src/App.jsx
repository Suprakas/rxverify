import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './features/auth/authSlice.js';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Attempt session restoration via httpOnly refresh cookie
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
