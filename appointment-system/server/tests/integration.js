/**
 * Integration test runner — standalone Node.js script.
 *
 * Uses the local MongoDB with a dedicated test database.
 * Run: npm run test:integration
 *
 * This avoids Jest's module transformation issues with the MongoDB driver.
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const TEST_URI = 'mongodb://localhost:27017/doctor-appointments-test';
const BASE = 'http://localhost:5174'; // test server port

let server;
let passed = 0;
let failed = 0;
const failures = [];

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

const req = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
};

const getFutureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
};

// ─── Tests ────────────────────────────────────────────────────────────────────

const runTests = async () => {
  console.log('\n🧪 Doctor Appointment API — Integration Tests\n');

  // Clean test DB
  await mongoose.connect(TEST_URI);
  await mongoose.connection.db.dropDatabase();

  // Start the app on a test port
  process.env.MONGO_URI = TEST_URI;
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5174';

  const app = require('../server');
  // Require models AFTER server so they share the same mongoose instance
  const Doctor = require('../models/Doctor');
  server = app.listen(5174);

  // ─── AUTH ────────────────────────────────────────

  console.log('\n📦 Auth');

  await test('Register patient → 201', async () => {
    const r = await req('POST', '/api/auth/register', {
      name: 'Test Patient', email: 'p@test.com', phone: '+1234567890',
      password: 'password123', role: 'patient',
    });
    assert(r.status === 201, `Expected 201, got ${r.status}`);
    assert(r.body.data.token, 'No token');
    assert(!r.body.data.user.password, 'Password leaked');
  });

  await test('Register doctor → 201', async () => {
    const r = await req('POST', '/api/auth/register', {
      name: 'Test Doctor', email: 'd@test.com', phone: '+1987654321',
      password: 'password123', role: 'doctor',
      specialization: 'Cardiology', experience: 10, fee: 150,
    });
    assert(r.status === 201, `Expected 201, got ${r.status}`);
    assert(r.body.data.user.role === 'doctor', 'Not doctor role');
  });

  await test('Duplicate email → 409', async () => {
    const r = await req('POST', '/api/auth/register', {
      name: 'Dup', email: 'p@test.com', phone: '+1111111111',
      password: 'pass1234', role: 'patient',
    });
    assert(r.status === 409, `Expected 409, got ${r.status}`);
  });

  await test('Bad input → 400', async () => {
    const r = await req('POST', '/api/auth/register', {
      name: 'X', email: 'bad', phone: '1', password: '12',
    });
    assert(r.status === 400, `Expected 400, got ${r.status}`);
    assert(r.body.errors.length > 0, 'No validation errors');
  });

  await test('Login → JWT', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'p@test.com', password: 'password123' });
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.body.data.token, 'No token');
    assert(!r.body.data.user.password, 'Password leaked');
  });

  await test('Wrong password → 401', async () => {
    const r = await req('POST', '/api/auth/login', { email: 'p@test.com', password: 'wrong' });
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  await test('/me without token → 401', async () => {
    const r = await req('GET', '/api/auth/me');
    assert(r.status === 401, `Expected 401, got ${r.status}`);
  });

  const loginRes = await req('POST', '/api/auth/login', { email: 'p@test.com', password: 'password123' });
  const patientToken = loginRes.body.data.token;

  await test('/me with token → user data', async () => {
    const r = await req('GET', '/api/auth/me', null, patientToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.body.data.user.email === 'p@test.com', 'Wrong email');
  });

  // ─── BOOKING WORKFLOW ────────────────────────────

  console.log('\n📦 Booking Workflow');

  // Approve doctor + set availability
  const docLogin = await req('POST', '/api/auth/login', { email: 'd@test.com', password: 'password123' });
  const doctorToken = docLogin.body.data.token;
  const docUser = docLogin.body.data.user;
  const doc = await Doctor.findOne({ user: docUser._id });
  doc.isApproved = true;
  doc.weeklyAvailability = Array.from({ length: 7 }, (_, i) => ({ day: i, start: '09:00', end: '17:00' }));
  await doc.save();
  const doctorId = doc._id.toString();

  const futureDate = getFutureDate();

  await test('Slots → 16 × 30-min', async () => {
    const r = await req('GET', `/api/doctors/${doctorId}/slots?date=${futureDate}`);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.body.data.availableSlots.length === 16, `Expected 16, got ${r.body.data.availableSlots.length}`);
    assert(r.body.data.availableSlots.includes('09:00'), 'Missing 09:00');
  });

  await test('Book → 201', async () => {
    const r = await req('POST', '/api/appointments', {
      doctorId, date: futureDate, startTime: '09:00', reason: 'Check',
    }, patientToken);
    assert(r.status === 201, `Expected 201, got ${r.status}: ${r.body.message}`);
    assert(r.body.data.status === 'booked', 'Not booked');
  });

  await test('Double-book → rejected', async () => {
    const r = await req('POST', '/api/appointments', {
      doctorId, date: futureDate, startTime: '09:00',
    }, patientToken);
    assert([400, 409].includes(r.status), `Expected 400/409, got ${r.status}`);
  });

  await test('Booked slot removed', async () => {
    const r = await req('GET', `/api/doctors/${doctorId}/slots?date=${futureDate}`);
    assert(!r.body.data.availableSlots.includes('09:00'), '09:00 still available');
    assert(r.body.data.availableSlots.length === 15, `Expected 15, got ${r.body.data.availableSlots.length}`);
  });

  // Get the appointment ID
  const myAppts = await req('GET', '/api/appointments/my', null, patientToken);
  const apptId = myAppts.body.data.find((a) => a.status === 'booked')._id;

  await test('Cancel → slot re-opens', async () => {
    const r = await req('PATCH', `/api/appointments/${apptId}/cancel`, {}, patientToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    const slots = await req('GET', `/api/doctors/${doctorId}/slots?date=${futureDate}`);
    assert(slots.body.data.availableSlots.includes('09:00'), '09:00 not restored');
    assert(slots.body.data.availableSlots.length === 16, `Expected 16, got ${slots.body.data.availableSlots.length}`);
  });

  // Book again for reschedule test
  const bookRes = await req('POST', '/api/appointments', {
    doctorId, date: futureDate, startTime: '09:00',
  }, patientToken);
  const newApptId = bookRes.body.data._id;

  await test('Reschedule → old free, new taken', async () => {
    const r = await req('PATCH', `/api/appointments/${newApptId}/reschedule`, {
      date: futureDate, startTime: '10:00',
    }, patientToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.body.data.startTime === '10:00', 'Wrong time');
    const slots = await req('GET', `/api/doctors/${doctorId}/slots?date=${futureDate}`);
    assert(slots.body.data.availableSlots.includes('09:00'), '09:00 not freed');
    assert(!slots.body.data.availableSlots.includes('10:00'), '10:00 still free');
  });

  // Get the rescheduled appointment
  const myAppts2 = await req('GET', '/api/appointments/my', null, patientToken);
  const rescheduledId = myAppts2.body.data.find((a) => a.status === 'booked')._id;

  await test('Complete → doctor marks done', async () => {
    const r = await req('PATCH', `/api/appointments/${rescheduledId}/complete`, {
      notes: 'All good.',
    }, doctorToken);
    assert(r.status === 200, `Expected 200, got ${r.status}`);
    assert(r.body.data.status === 'completed', 'Not completed');
    assert(r.body.data.notes === 'All good.', 'Wrong notes');
  });

  // ─── Summary ─────────────────────────────────────

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ✅ Passed: ${passed}  ❌ Failed: ${failed}  Total: ${passed + failed}`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    failures.forEach((f) => console.log(`    - ${f.name}: ${f.error}`));
  }
  console.log(`${'═'.repeat(50)}\n`);

  // Cleanup
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.close();

  process.exit(failed > 0 ? 1 : 0);
};

runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
