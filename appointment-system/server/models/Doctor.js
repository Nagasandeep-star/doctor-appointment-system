const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0 = Sunday, 6 = Saturday
    },
    start: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'],
    },
    end: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'],
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    fee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    slotDuration: {
      type: Number,
      default: 30,
      min: [10, 'Slot duration must be at least 10 minutes'],
      max: [120, 'Slot duration cannot exceed 120 minutes'],
    },
    weeklyAvailability: [availabilitySlotSchema],
    leaveDates: [
      {
        type: String,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Leave date must be in YYYY-MM-DD format'],
      },
    ],
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
