const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const { registerSchema, loginSchema } = require('../validation/authSchema');

/**
 * Generate a signed JWT for a given user id.
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Send JWT + user data in a consistent shape.
 * Password is never included.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Convert mongoose doc to plain object and strip password
  const userData = user.toObject ? user.toObject() : { ...user };
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    data: { token, user: userData },
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Zod parse — coerce numeric fields from request body strings
    const body = {
      ...req.body,
      experience: req.body.experience !== undefined
        ? Number(req.body.experience)
        : undefined,
      fee: req.body.fee !== undefined ? Number(req.body.fee) : undefined,
    };

    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { name, email, phone, password, role, specialization, experience, fee } =
      result.data;

    // Create user
    const user = await User.create({ name, email, phone, password, role });

    // If doctor, create Doctor profile (unapproved)
    if (role === 'doctor') {
      await Doctor.create({
        user: user._id,
        specialization,
        experience,
        fee,
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { email, password } = result.data;

    // Explicitly select password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is already set by protect middleware (without password)
    const user = req.user;

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await Doctor.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        ...(doctorProfile && { doctor: doctorProfile }),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
