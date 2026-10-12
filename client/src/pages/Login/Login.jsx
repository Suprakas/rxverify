import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../features/auth/authSlice.js';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import './Login.css';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch, location]);

  const onSubmit = async (data) => {
    await dispatch(loginUser(data));
  };

  const handleQuickLogin = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="rx-auth-page">
      <div className="rx-auth-card">
        <div className="rx-auth-header">
          <div className="rx-auth-logo">
            <span className="rx-auth-logo-badge">Rx</span>
          </div>
          <h1 className="rx-auth-title">Sign in to RxVerify</h1>
          <p className="rx-auth-subtitle">
            Secure clinical prescription verification portal for licensed pharmacies and patients.
          </p>
        </div>

        {error && (
          <Alert
            variant="danger"
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="rx-auth-form" noValidate>
          <FormField
            label="Work Email or Patient Account"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="e.g. pharmacist@rxverify.com"
              hasError={Boolean(errors.email)}
              {...register('email')}
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            required
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              hasError={Boolean(errors.password)}
              {...register('password')}
              autoComplete="current-password"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="rx-auth-divider">
          <span>Quick Demo Roles</span>
        </div>

        <div className="rx-demo-buttons">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('pharmacist@rxverify.com', 'Pharma@12345')}
            disabled={isLoading}
            className="rx-demo-btn"
          >
            <span className="rx-demo-btn__role">Pharmacist</span>
            <span className="rx-demo-btn__name">Marcus Chen, PharmD</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('patient@rxverify.com', 'Patient@12345')}
            disabled={isLoading}
            className="rx-demo-btn"
          >
            <span className="rx-demo-btn__role">Patient</span>
            <span className="rx-demo-btn__name">Sarah Jenkins</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleQuickLogin('admin@rxverify.com', 'Admin@12345')}
            disabled={isLoading}
            className="rx-demo-btn"
          >
            <span className="rx-demo-btn__role">Admin</span>
            <span className="rx-demo-btn__name">Dr. Eleanor Vance</span>
          </Button>
        </div>

        <div className="rx-auth-footer">
          <p>
            Do not have an account?{' '}
            <Link to="/register" className="rx-auth-link">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
