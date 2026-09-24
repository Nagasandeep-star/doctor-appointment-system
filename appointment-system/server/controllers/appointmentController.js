const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getAvailableSlots } = require('../services/slotService');
const {
  bookAppointmentSchema,
  rescheduleSchema,
  completeSchema,
} = require('../validation/appointmentSchema');
const { sendBookingConfirmation, sendCancellationEmail } = require('../services/emailService');

// ─────────────────────────────────────────────
// GET /api/doctors/:id/slots?date=YYYY-MM-DD
// Public
// ─────────────────────────────────────────────
const getSlotsForDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return next(new AppError('Query parameter "date" is required in YYYY-MM-DD format', 400));
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) return next(new AppError('Doctor not found', 404));
    if (!doctor.isApproved) return next(new AppError('Doctor is not approved', 403));

    // Fetch currently booked slots for this doctor + date
    const bookedAppointments = await Appointment.find({
      doctor: id,
      date,
      status: 'booked',
    }).select('startTime');

    const bookedSlots = bookedAppointments.map((a) => a.startTime);

    const available = getAvailableSlots(doctor, date, bookedSlots);

    res.status(200).json({
      success: true,
      data: {
        doctorId: id,
        date,
        slotDuration: doctor.slotDuration,
        availableSlots: available,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/appointments
// Patient only
// ─────────────────────────────────────────────
const bookAppointment = async (req, res, next) => {
  try {
    const result = bookAppointmentSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { doctorId, date, startTime, reason } = result.data;

    // Verify doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return next(new AppError('Doctor not found', 404));
    if (!doctor.isApproved) return next(new AppError('Doctor is not approved', 403));

    // Verify the slot is in the available list
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      status: 'booked',
    }).select('startTime');
    const bookedSlots = bookedAppointments.map((a) => a.startTime);
    const available = getAvailableSlots(doctor, date, bookedSlots);

    if (!available.includes(startTime)) {
      return next(new AppError('Selected slot is not available', 400));
    }

    // Create appointment — the partial unique index will catch true races
    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: req.user._id,
      date,
      startTime,
      reason,
    });

    const populated = await appointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email' } },
      { path: 'patient', select: 'name email phone' },
    ]);

    // Send confirmation email (non-blocking, never fails the booking)
    try {
      await sendBookingConfirmation({
        patientEmail: populated.patient?.email,
        patientName: populated.patient?.name,
        doctorName: populated.doctor?.user?.name || 'Doctor',
        date,
        startTime,
      });
    } catch (emailErr) {
      console.error('Email error (non-fatal):', emailErr.message);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // Mongo duplicate key on the partial unique index → 409
    if (err.code === 11000) {
      return next(new AppError('Slot already booked', 409));
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/appointments/my
// Patient sees own, Doctor sees own
// ─────────────────────────────────────────────
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    let filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) return next(new AppError('Doctor profile not found', 404));
      filter.doctor = doctor._id;
    }

    if (status) filter.status = status;
    if (date) filter.date = date;

    const appointments = await Appointment.find(filter)
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate('patient', 'name email phone')
      .sort({ date: -1, startTime: -1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/cancel
// Patient can cancel their own booked; Doctor can cancel their own
// ─────────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor');

    if (!appointment) return next(new AppError('Appointment not found', 404));
    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot cancel an appointment with status "${appointment.status}"`, 400));
    }

    // Authorization check
    if (req.user.role === 'patient') {
      if (appointment.patient.toString() !== req.user._id.toString()) {
        return next(new AppError('Not authorized to cancel this appointment', 403));
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor || appointment.doctor._id.toString() !== doctor._id.toString()) {
        return next(new AppError('Not authorized to cancel this appointment', 403));
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Send cancellation email (non-blocking)
    try {
      const patient = await User.findById(appointment.patient);
      const doctorUser = appointment.doctor?.user;
      const doctorName = typeof doctorUser === 'object' ? doctorUser.name : 'Doctor';
      if (patient) {
        await sendCancellationEmail({
          patientEmail: patient.email,
          patientName: patient.name,
          doctorName,
          date: appointment.date,
          startTime: appointment.startTime,
        });
      }
    } catch (emailErr) {
      console.error('Email error (non-fatal):', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/reschedule
// Patient only — same doctor, new date/time
// ─────────────────────────────────────────────
const rescheduleAppointment = async (req, res, next) => {
  try {
    const result = rescheduleSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const { date, startTime } = result.data;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError('Appointment not found', 404));
    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot reschedule an appointment with status "${appointment.status}"`, 400));
    }
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to reschedule this appointment', 403));
    }

    // Verify new slot is available
    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) return next(new AppError('Doctor not found', 404));

    const bookedAppointments = await Appointment.find({
      doctor: appointment.doctor,
      date,
      status: 'booked',
      _id: { $ne: appointment._id }, // exclude current appointment
    }).select('startTime');
    const bookedSlots = bookedAppointments.map((a) => a.startTime);
    const available = getAvailableSlots(doctor, date, bookedSlots);

    if (!available.includes(startTime)) {
      return next(new AppError('Selected slot is not available', 400));
    }

    // Cancel old and create new (atomic-style)
    appointment.status = 'cancelled';
    await appointment.save();

    const newAppointment = await Appointment.create({
      doctor: appointment.doctor,
      patient: req.user._id,
      date,
      startTime,
      reason: appointment.reason,
    });

    const populated = await newAppointment.populate([
      { path: 'doctor', populate: { path: 'user', select: 'name email' } },
      { path: 'patient', select: 'name email phone' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: populated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('Slot already booked', 409));
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/appointments/:id/complete
// Doctor only — mark completed + optional notes
// ─────────────────────────────────────────────
const completeAppointment = async (req, res, next) => {
  try {
    const result = completeSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, errors));
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError('Appointment not found', 404));
    if (appointment.status !== 'booked') {
      return next(new AppError(`Cannot complete an appointment with status "${appointment.status}"`, 400));
    }

    // Verify the doctor owns this appointment
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
      return next(new AppError('Not authorized to complete this appointment', 403));
    }

    appointment.status = 'completed';
    if (result.data.notes) appointment.notes = result.data.notes;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSlotsForDoctor,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
};
