import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'rxverify_access_secret_dev_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'rxverify_refresh_secret_dev_key_2026';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      licenseNumber: user.licenseNumber || null,
    },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
