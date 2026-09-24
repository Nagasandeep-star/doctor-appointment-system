/**
 * Integration tests for Doctor Appointment API.
 *
 * Uses local MongoDB with a dedicated test database.
 * Mongoose connection is established once before all tests.
 *
 * Prerequisites: local MongoDB running on localhost:27017
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const TEST_URI = 'mongodb://localhost:27017/doctor-appointments-test';

let app;

beforeAll(async () => {
  // Set env BEFORE requiring server (dotenv won't override existing vars)
  process.env.MONGO_URI = TEST_URI;
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';

  // Connect mongoose explicitly
  await mongoose.connect(TEST_URI);

  // Now require server — it skips connectDB() when NODE_ENV=test
  // Clear require cache first to avoid stale modules
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('appointment-system') && !key.includes('node_modules') && !key.includes('test')) {
      delete require.cache[key];
    }
  });

  app = require('../server');
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
}, 30000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const colls = Object.keys(mongoose.connection.collections);
    for (const name of colls) {
      await mongoose.connection.collections[name].deleteMany({});
    }
  }
}, 15000);

// ─── Test Data ────────────────────────────────────────────────────────────────

const patientData = {
  name: 'Test Patient', email: 'patient@test.com',
  phone: '+1234567890', password: 'password123', role: 'patient',
};

const doctorRegData = {
  name: 'Test Doctor', email: 'doctor@test.com',
  phone: '+1987654321', password: 'password123', role: 'doctor',
  specialization: 'Cardiology', experience: 10, fee: 150,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const registerPatient = async () => {
  const res = await request(app).post('/api/auth/register').send(patientData);
  return res.body.data.token;
};

const createApprovedDoctor = async () => {
  const res = await request(app).post('/api/auth/register').send(doctorRegData);
  const token = res.body.data.token;
  const userId = res.body.data.user._id;
  const doc = await Doctor.findOne({ user: userId });
  doc.isApproved = true;
  doc.weeklyAvailability = Array.from({ length: 7 }, (_, i) => ({
    day: i, start: '09:00', end: '17:00',
  }));
  await doc.save();
  return { doctorId: doc._id.toString(), doctorToken: token };
};

const getFutureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth', () => {
  test('register patient → returns 201 + token', async () => {
    const res = await request(app).post('/api/auth/register').send(patientData).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.name).toBe('Test Patient');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('register doctor → returns 201', async () => {
    const res = await request(app).post('/api/auth/register').send(doctorRegData).expect(201);
    expect(res.body.data.user.role).toBe('doctor');
  });

  test('duplicate email → 409', async () => {
    await request(app).post('/api/auth/register').send(patientData);
    const res = await request(app).post('/api/auth/register').send(patientData).expect(409);
    expect(res.body.message).toContain('email already exists');
  });

  test('bad input → 400 with errors', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'X', email: 'bad', phone: '1', password: '12' }).expect(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('login → returns JWT', async () => {
    await request(app).post('/api/auth/register').send(patientData);
    const res = await request(app).post('/api/auth/login')
      .send({ email: patientData.email, password: patientData.password }).expect(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('wrong password → 401', async () => {
    await request(app).post('/api/auth/register').send(patientData);
    await request(app).post('/api/auth/login')
      .send({ email: patientData.email, password: 'wrong' }).expect(401);
  });

  test('/me without token → 401', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  test('/me with token → user data', async () => {
    const regRes = await request(app).post('/api/auth/register').send(patientData);
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${regRes.body.data.token}`).expect(200);
    expect(res.body.data.user.email).toBe(patientData.email);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Booking', () => {
  let pToken, dId, dToken;

  beforeEach(async () => {
    pToken = await registerPatient();
    const d = await createApprovedDoctor();
    dId = d.doctorId;
    dToken = d.doctorToken;
  });

  test('slots → 16 × 30-min slots', async () => {
    const res = await request(app)
      .get(`/api/doctors/${dId}/slots?date=${getFutureDate()}`).expect(200);
    expect(res.body.data.availableSlots.length).toBe(16);
    expect(res.body.data.availableSlots).toContain('09:00');
  });

  test('book → 201 booked', async () => {
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ doctorId: dId, date: getFutureDate(), startTime: '09:00', reason: 'Check' })
      .expect(201);
    expect(res.body.data.status).toBe('booked');
  });

  test('double-book → 400/409', async () => {
    const body = { doctorId: dId, date: getFutureDate(), startTime: '09:00' };
    await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`).send(body).expect(201);
    const res = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`).send(body);
    expect([400, 409]).toContain(res.status);
  });

  test('booked slot removed from list', async () => {
    const date = getFutureDate();
    await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ doctorId: dId, date, startTime: '09:00' }).expect(201);
    const res = await request(app).get(`/api/doctors/${dId}/slots?date=${date}`).expect(200);
    expect(res.body.data.availableSlots).not.toContain('09:00');
    expect(res.body.data.availableSlots.length).toBe(15);
  });

  test('cancel → slot re-opens', async () => {
    const date = getFutureDate();
    const b = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ doctorId: dId, date, startTime: '09:00' }).expect(201);
    await request(app).patch(`/api/appointments/${b.body.data._id}/cancel`)
      .set('Authorization', `Bearer ${pToken}`).expect(200);
    const slots = await request(app).get(`/api/doctors/${dId}/slots?date=${date}`).expect(200);
    expect(slots.body.data.availableSlots).toContain('09:00');
    expect(slots.body.data.availableSlots.length).toBe(16);
  });

  test('reschedule → old slot free, new slot taken', async () => {
    const date = getFutureDate();
    const b = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ doctorId: dId, date, startTime: '09:00' }).expect(201);
    const res = await request(app).patch(`/api/appointments/${b.body.data._id}/reschedule`)
      .set('Authorization', `Bearer ${pToken}`)
      .send({ date, startTime: '10:00' }).expect(200);
    expect(res.body.data.startTime).toBe('10:00');
    const slots = await request(app).get(`/api/doctors/${dId}/slots?date=${date}`).expect(200);
    expect(slots.body.data.availableSlots).toContain('09:00');
    expect(slots.body.data.availableSlots).not.toContain('10:00');
  });

  test('complete → doctor marks done with notes', async () => {
    const b = await request(app).post('/api/appointments')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ doctorId: dId, date: getFutureDate(), startTime: '09:00' }).expect(201);
    const res = await request(app).patch(`/api/appointments/${b.body.data._id}/complete`)
      .set('Authorization', `Bearer ${dToken}`)
      .send({ notes: 'All good.' }).expect(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.notes).toBe('All good.');
  });
});
