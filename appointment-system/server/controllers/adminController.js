const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────
// GET /api/admin/users
// Admin only
// ─────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/doctors
// Admin only — all doctors with pending/approved status
// ─────────────────────────────────────────────
const listAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({})
      .populate('user', 'name email phone createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/doctors/:id/approve
// Admin only
// ─────────────────────────────────────────────
const approveDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
    if (!doctor) return next(new AppError('Doctor not found', 404));

    doctor.isApproved = true;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Dr. ${doctor.user.name} has been approved`,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/doctors/:id/reject
// Admin only — sets isApproved to false
// ─────────────────────────────────────────────
const rejectDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');
    if (!doctor) return next(new AppError('Doctor not found', 404));

    doctor.isApproved = false;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Dr. ${doctor.user.name} has been rejected/suspended`,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Admin only — populated fully in Phase 5
// ─────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDoctors, totalAppointments, cancelledCount] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments({ isApproved: true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);

    const cancellationRate = totalAppointments > 0
      ? ((cancelledCount / totalAppointments) * 100).toFixed(1)
      : 0;

    // Appointments per day — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointmentsPerDay = await Appointment.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    // Top 5 doctors by appointment count
    const topDoctors = await Appointment.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          doctorId: '$_id',
          name: '$user.name',
          specialization: '$doctor.specialization',
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        cancelledCount,
        cancellationRate: Number(cancellationRate),
        appointmentsPerDay,
        topDoctors,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, listAllDoctors, approveDoctor, rejectDoctor, getStats };
