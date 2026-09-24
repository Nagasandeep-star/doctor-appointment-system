/**
 * Seed script — creates test data for development.
 *
 * Creates:
 *   - 1 admin user
 *   - 3 approved doctors (with Mon–Fri 09:00–17:00 availability)
 *   - 2 patients
 *   - Sample booked appointments
 *
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const WEEKDAY_AVAILABILITY = [
  { day: 1, start: '09:00', end: '17:00' },
  { day: 2, start: '09:00', end: '17:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '17:00' },
  { day: 5, start: '09:00', end: '17:00' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Admin ────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@docappoint.com',
      phone: '+1000000001',
      password: 'admin123',
      role: 'admin',
    });
    console.log(`👑 Admin: ${admin.email} / admin123`);

    // ── Doctors ──────────────────────────────────────
    const doctorData = [
      { name: 'Dr. Sarah Chen', email: 'sarah@docappoint.com', phone: '+1000000002', specialization: 'Cardiology', experience: 12, fee: 150 },
      { name: 'Dr. James Wilson', email: 'james@docappoint.com', phone: '+1000000003', specialization: 'Dermatology', experience: 8, fee: 120 },
      { name: 'Dr. Priya Patel', email: 'priya@docappoint.com', phone: '+1000000004', specialization: 'Pediatrics', experience: 15, fee: 130 },
    ];

    const doctors = [];
    for (const d of doctorData) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        phone: d.phone,
        password: 'doctor123',
        role: 'doctor',
      });

      const doctor = await Doctor.create({
        user: user._id,
        specialization: d.specialization,
        experience: d.experience,
        fee: d.fee,
        isApproved: true,
        slotDuration: 30,
        weeklyAvailability: WEEKDAY_AVAILABILITY,
        leaveDates: [],
      });

      doctors.push(doctor);
      console.log(`👨‍⚕️ Doctor: ${d.email} / doctor123 — ${d.specialization}`);
    }

    // ── Patients ─────────────────────────────────────
    const patient1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1000000005',
      password: 'patient123',
      role: 'patient',
    });
    const patient2 = await User.create({
      name: 'Bob Martinez',
      email: 'bob@example.com',
      phone: '+1000000006',
      password: 'patient123',
      role: 'patient',
    });
    console.log(`🧑 Patient: ${patient1.email} / patient123`);
    console.log(`🧑 Patient: ${patient2.email} / patient123`);

    // ── Sample Appointments ──────────────────────────
    // Get a future weekday date (next Monday)
    const now = new Date();
    const daysUntilMonday = ((8 - now.getDay()) % 7) || 7; // next Monday
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    const mondayStr = nextMonday.toISOString().slice(0, 10);

    const nextTuesday = new Date(nextMonday);
    nextTuesday.setDate(nextMonday.getDate() + 1);
    const tuesdayStr = nextTuesday.toISOString().slice(0, 10);

    await Appointment.create([
      { doctor: doctors[0]._id, patient: patient1._id, date: mondayStr, startTime: '09:00', reason: 'Chest pain', status: 'booked' },
      { doctor: doctors[0]._id, patient: patient2._id, date: mondayStr, startTime: '10:00', reason: 'Annual checkup', status: 'booked' },
      { doctor: doctors[1]._id, patient: patient1._id, date: tuesdayStr, startTime: '11:00', reason: 'Skin rash', status: 'booked' },
      { doctor: doctors[2]._id, patient: patient2._id, date: mondayStr, startTime: '14:00', reason: 'Child vaccination', status: 'booked' },
    ]);
    console.log(`📋 Created 4 sample appointments`);

    console.log('\n✅ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Login credentials:');
    console.log('  Admin:    admin@docappoint.com / admin123');
    console.log('  Doctor 1: sarah@docappoint.com / doctor123');
    console.log('  Doctor 2: james@docappoint.com / doctor123');
    console.log('  Doctor 3: priya@docappoint.com / doctor123');
    console.log('  Patient 1: alice@example.com / patient123');
    console.log('  Patient 2: bob@example.com / patient123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
