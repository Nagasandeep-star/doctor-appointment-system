const AppError = require('../utils/AppError');

/**
 * Centralized error-handling middleware.
 * Produces a consistent JSON error shape:
 *   { success: false, message: "...", errors: [...] }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Mongoose: document not found
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found`;
  }

  // Mongoose: duplicate key (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field === 'email'
      ? 'An account with that email already exists'
      : 'Slot already booked';
  }

  // Mongoose: validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Never leak stack traces in production
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    console.error('💥 UNHANDLED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
