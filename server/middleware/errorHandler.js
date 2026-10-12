import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token has expired',
    });
  }

  // Duplicate key (MongoDB code 11000)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'A record with that email already exists',
    });
  }

  // Custom ApiError with status code
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
