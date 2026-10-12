import { useSelector } from 'react-redux';

/**
 * Custom hook for Role-Based Access Control (RBAC) permissions.
 * Inspects the current authenticated user's role and exposes convenience guards.
 */
export function usePermission() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const role = user?.role || null;
  const isPatient = role === 'patient';
  const isPharmacist = role === 'pharmacist';
  const isAdmin = role === 'admin';

  /**
   * Check if user matches any of the given roles.
   * @param  {...string} roles - e.g. hasRole('pharmacist', 'admin')
   */
  const hasRole = (...roles) => {
    if (!isAuthenticated || !role) return false;
    const flatRoles = roles.flat();
    return flatRoles.includes(role);
  };

  /**
   * Check if user has permission to perform an action.
   * @param {string} action - Action identifier
   */
  const can = (action) => {
    if (!isAuthenticated || !role) return false;

    switch (action) {
      case 'verify_prescription':
      case 'flag_prescription':
      case 'reject_prescription':
        return isPharmacist;

      case 'create_prescription':
        return isPatient || isPharmacist;

      case 'view_queue':
        return isPharmacist || isAdmin;

      case 'manage_users':
      case 'view_audit_logs':
      case 'view_analytics':
        return isAdmin;

      case 'view_my_prescriptions':
        return isPatient;

      default:
        return false;
    }
  };

  return {
    role,
    user,
    isAuthenticated,
    isPatient,
    isPharmacist,
    isAdmin,
    hasRole,
    can,
  };
}

export default usePermission;