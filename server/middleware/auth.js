import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Authentication middleware that verifies JWT access token
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required: missing or invalid authorization token',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid access token',
    });
  }
}

/**
 * Authorization middleware for Role-Based Access Control (RBAC)
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'pharmacist', 'patient')
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required: no active user context',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: user role '${req.user.role}' is not authorized to perform this action`,
      });
    }

    next();
  };
}

// Backward-compatible aliases
export const authenticate = requireAuth;
export const authorizeRoles = authorize;