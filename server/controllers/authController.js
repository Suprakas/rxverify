import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

// Zod schemas for request validation
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['patient', 'pharmacist', 'admin']).default('patient'),
    licenseNumber: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.role === 'pharmacist' && (!data.licenseNumber || data.licenseNumber.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'License number is required for pharmacists',
      path: ['licenseNumber'],
    }
  );

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export async function register(req, res, next) {
  try {
    const { name, email, password, role, licenseNumber, phone, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber: role === 'pharmacist' ? licenseNumber : null,
      phone: phone || null,
      dateOfBirth: role === 'patient' ? dateOfBirth || null : null,
      refreshToken: null,
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Save refresh token to user
    await User.findByIdAndUpdate(newUser._id || newUser.id, { refreshToken });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        licenseNumber: newUser.licenseNumber,
        phone: newUser.phone,
        dateOfBirth: newUser.dateOfBirth,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id || user.id, { refreshToken });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const incomingToken = tokenFromCookie || tokenFromBody;

    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token missing',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingToken);
    } catch (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== incomingToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid refresh token session',
      });
    }

    // Token rotation
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id || user.id, { refreshToken: newRefreshToken });

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    if (tokenFromCookie) {
      try {
        const decoded = verifyRefreshToken(tokenFromCookie);
        if (decoded?.id) {
          await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
        }
      } catch (e) {
        // Ignore token decode failure on logout
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        licenseNumber: user.licenseNumber,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    next(err);
  }
}
