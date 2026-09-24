const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { setAvailabilitySchema, addLeaveSchema } = require('../validation/doctorSchema');

// ─────────────────────────────────────────────
// GET /api/doctors
// Public — returns only approved doctors
// Query: name, specialization
// ─────────────────────────────────────────────
const getDoctors = async (req, res, next) => {
  try {
    const { name, specialization } = req.query;

    // Build a filter against the populated User document
    let userFilter = {};
    if (name) {
      userFilter.name = { $regex: name, $options: 'i' };
    }

    let doctorFilter = { isApproved: true };
    if (specialization) {
      doctorFilter.specialization = { $regex: specialization, $options: 'i' };
    }

    let doctors;
    if (name) {
      // Filter by user name requires finding matching users first
      const matchingUsers = await User.find(userFilter).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      doctorFilter.user = { $in: userIds };
    }

    doctors = await Doctor.find(doctorFilter)
      .populate('user', 'name email phone')
      .select('-leaveDates -weeklyAvailability -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/doctors/:id
// Public — single doctor details
// ─────────────────────────────────────────────
const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!doctor) {
      return next(new AppError('Doctor not found', 404));
    }
    if (!doctor.isApproved) {
      return next(new AppError('Doctor is not yet approved', 403));
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /api/doctors/availability
// Doctor only
// ─────────────────────────────────────────────
const setAvailability = async (req, res, next) => {
  try {
    const result = setAvailabilitySchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { weeklyAvailability, slotDuration } = result.data;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return next(new AppError('Doctor profile not found', 404));
    }

    doctor.weeklyAvailability = weeklyAvailability;
    if (slotDuration !== undefined) {
      doctor.slotDuration = slotDuration;
    }
    await doctor.save();

    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/doctors/leave
// Doctor only — add a leave date
// ─────────────────────────────────────────────
const addLeave = async (req, res, next) => {
  try {
    const result = addLeaveSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { date } = result.data;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return next(new AppError('Doctor profile not found', 404));
    }

    if (doctor.leaveDates.includes(date)) {
      return next(new AppError(`Leave date ${date} is already set`, 409));
    }

    doctor.leaveDates.push(date);
    await doctor.save();

    res.status(200).json({ success: true, data: doctor.leaveDates });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/doctors/leave
// Doctor only — remove a leave date
// ─────────────────────────────────────────────
const removeLeave = async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return next(new AppError('Date is required', 400));

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return next(new AppError('Doctor profile not found', 404));

    const idx = doctor.leaveDates.indexOf(date);
    if (idx === -1) return next(new AppError(`Leave date ${date} not found`, 404));

    doctor.leaveDates.splice(idx, 1);
    await doctor.save();

    res.status(200).json({ success: true, data: doctor.leaveDates });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/doctors/me
// Doctor only — own profile
// ─────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id })
      .populate('user', 'name email phone');

    if (!doctor) return next(new AppError('Doctor profile not found', 404));

    res.status(200).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDoctors, getDoctorById, setAvailability, addLeave, removeLeave, getMyProfile };
