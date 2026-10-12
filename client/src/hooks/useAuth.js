import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, accessToken, isAuthenticated, isLoading, error } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    isPharmacist: user?.role === 'pharmacist',
    isPatient: user?.role === 'patient',
    isAdmin: user?.role === 'admin',
    role: user?.role,
  };
}

export default useAuth;
