import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice.js';
import Button from '../../components/Button/Button.jsx';
import Input from '../../components/Input/Input.jsx';
import FormField from '../../components/FormField/FormField.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import './Register.css';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['patient', 'pharmacist', 'admin']),
    licenseNumber: z.string().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'pharmacist') {
        return Boolean(data.licenseNumber && data.licenseNumber.trim().length >= 3);
      }
      return true;
    },
    {
      message: 'State pharmacist license number is required (min 3 chars)',
      path: ['licenseNumber'],
    }
  );

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      licenseNumber: '',
      phone: '',
      dateOfBirth: '',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...payload } = data;
    await dispatch(registerUser(payload));
  };

  return (
    <div className="rx-register-page">
      <div className="rx-register-card">
        <div className="rx-register-header">
          <div className="rx-register-logo">
            <span className="rx-register-logo-badge">Rx</span>
          </div>
          <h1 className="rx-register-title">Create an RxVerify Account</h1>
          <p className="rx-register-subtitle">
            Join the verified pharmacy network as a Patient, Licensed Pharmacist, or Clinic Admin.
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

        <form onSubmit={handleSubmit(onSubmit)} className="rx-register-form" noValidate>
          <FormField
            label="Full Legal Name"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              type="text"
              placeholder="e.g. Dr. Jordan Reed or Jane Doe"
              hasError={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField
            label="Account Role"
            htmlFor="role"
            required
            error={errors.role?.message}
          >
            <div className="rx-role-selector">
              <label className={`rx-role-option ${selectedRole === 'patient' ? 'rx-role-option--active' : ''}`}>
                <input
                  type="radio"
                  value="patient"
                  {...register('role')}
                  className="rx-role-radio"
                />
                <span className="rx-role-title">Patient</span>
                <span className="rx-role-desc">View and track prescriptions</span>
              </label>

              <label className={`rx-role-option ${selectedRole === 'pharmacist' ? 'rx-role-option--active' : ''}`}>
                <input
                  type="radio"
                  value="pharmacist"
                  {...register('role')}
                  className="rx-role-radio"
                />
                <span className="rx-role-title">Pharmacist</span>
                <span className="rx-role-desc">Verify queue & clinical safety</span>
              </label>

              <label className={`rx-role-option ${selectedRole === 'admin' ? 'rx-role-option--active' : ''}`}>
                <input
                  type="radio"
                  value="admin"
                  {...register('role')}
                  className="rx-role-radio"
                />
                <span className="rx-role-title">Admin</span>
                <span className="rx-role-desc">Pharmacy operations & audit</span>
              </label>
            </div>
          </FormField>

          {selectedRole === 'pharmacist' && (
            <FormField
              label="State Pharmacist License Number (RPh)"
              htmlFor="licenseNumber"
              required
              hint="Required by pharmacy board regulatory standards"
              error={errors.licenseNumber?.message}
            >
              <Input
                id="licenseNumber"
                type="text"
                placeholder="e.g. RPH-889123"
                hasError={Boolean(errors.licenseNumber)}
                {...register('licenseNumber')}
              />
            </FormField>
          )}

          {selectedRole === 'patient' && (
            <FormField
              label="Date of Birth"
              htmlFor="dateOfBirth"
              hint="Used to verify prescription matching identity"
              error={errors.dateOfBirth?.message}
            >
              <Input
                id="dateOfBirth"
                type="date"
                hasError={Boolean(errors.dateOfBirth)}
                {...register('dateOfBirth')}
              />
            </FormField>
          )}

          <div className="rx-form-grid-2">
            <FormField
              label="Email Address"
              htmlFor="email"
              required
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="you@domain.com"
                hasError={Boolean(errors.email)}
                {...register('email')}
                autoComplete="email"
              />
            </FormField>

            <FormField
              label="Contact Phone"
              htmlFor="phone"
              error={errors.phone?.message}
            >
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                hasError={Boolean(errors.phone)}
                {...register('phone')}
              />
            </FormField>
          </div>

          <div className="rx-form-grid-2">
            <FormField
              label="Password (min 8 chars)"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                hasError={Boolean(errors.password)}
                {...register('password')}
                autoComplete="new-password"
              />
            </FormField>

            <FormField
              label="Confirm Password"
              htmlFor="confirmPassword"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                hasError={Boolean(errors.confirmPassword)}
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isLoading}
            className="rx-register-submit-btn"
          >
            Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account
          </Button>
        </form>

        <div className="rx-register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="rx-register-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
