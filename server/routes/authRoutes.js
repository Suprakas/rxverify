import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  getUsers,
  registerSchema,
  loginSchema,
} from '../controllers/authController.js';
import { requireAuth, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

// Admin-only user directory endpoint
router.get('/users', requireAuth, authorize('admin'), getUsers);

export default router;
