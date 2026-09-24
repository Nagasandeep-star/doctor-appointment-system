# Doctor Appointment Booking System 🏥

A production-quality, full-stack appointment booking system built with the **MERN stack** (MongoDB, Express, React, Node.js). Features role-based access for patients, doctors, and administrators, real-time slot generation, conflict-safe booking, email notifications, and an admin analytics dashboard.

## Features

### Patient
- Register and login
- Search doctors by name or specialization
- View available time slots for any date
- Book, reschedule, and cancel appointments
- View appointment history with status filters

### Doctor
- Register (requires admin approval)
- Set weekly availability (day, start time, end time)
- Configure slot duration (15/20/30/45/60 min)
- Manage leave dates
- View today's and all appointments
- Mark appointments as completed with consultation notes

### Admin
- Approve or reject doctor registrations
- View all users and doctors
- Analytics dashboard with:
  - Appointments per day (area chart)
  - Top doctors by appointment count (bar chart)
  - Cancellation rate
  - System statistics

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v6, Tailwind CSS v4, Axios, React Hook Form + Zod, date-fns, Recharts, react-hot-toast |
| **Backend** | Node.js, Express 5, Mongoose 9, JWT, bcryptjs, Zod validation, helmet, cors, express-rate-limit, morgan |
| **Database** | MongoDB (Atlas or local) |
| **Notifications** | Nodemailer (SMTP), node-cron (hourly reminders) |
| **Testing** | Jest, Supertest, mongodb-memory-server |

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)
- **npm** ≥ 9

## Quick Start

### 1. Clone the repository
```bash
cd appointment-system
```

### 2. Backend setup
```bash
cd server
cp .env.example .env   # Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed           # Populates DB with test data
npm run dev            # Starts server on http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
cp .env.example .env
npm install
npm run dev            # Starts client on http://localhost:5173
```

### 4. Open the app
Navigate to **http://localhost:5173** and login with one of the seed accounts.

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@docappoint.com | admin123 |
| Doctor (Cardiology) | sarah@docappoint.com | doctor123 |
| Doctor (Dermatology) | james@docappoint.com | doctor123 |
| Doctor (Pediatrics) | priya@docappoint.com | doctor123 |
| Patient | alice@example.com | patient123 |
| Patient | bob@example.com | patient123 |

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/doctor-appointments |
| `JWT_SECRET` | Secret key for JWT signing | (required) |
| `JWT_EXPIRES_IN` | JWT token expiry | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:5173 |
| `EMAIL_HOST` | SMTP host (leave empty to disable) | — |
| `EMAIL_PORT` | SMTP port | 587 |
| `EMAIL_USER` | SMTP username | — |
| `EMAIL_PASS` | SMTP password/app password | — |
| `EMAIL_FROM` | Sender email display name | — |

### Client (`client/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | http://localhost:5000/api |

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register patient or doctor |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Get current user profile |

### Doctors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctors` | Public | List approved doctors (query: `name`, `specialization`) |
| GET | `/api/doctors/:id` | Public | Get doctor details |
| GET | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Public | Get available slots |
| GET | `/api/doctors/me` | Doctor | Get own doctor profile |
| PUT | `/api/doctors/availability` | Doctor | Set weekly availability |
| POST | `/api/doctors/leave` | Doctor | Add a leave date |
| DELETE | `/api/doctors/leave` | Doctor | Remove a leave date |

### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/appointments` | Patient | Book an appointment |
| GET | `/api/appointments/my` | Patient/Doctor | Get own appointments |
| PATCH | `/api/appointments/:id/cancel` | Patient/Doctor | Cancel a booked appointment |
| PATCH | `/api/appointments/:id/reschedule` | Patient | Reschedule to a new slot |
| PATCH | `/api/appointments/:id/complete` | Doctor | Mark completed + add notes |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard analytics |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/doctors` | Admin | List all doctors (pending + approved) |
| PATCH | `/api/admin/doctors/:id/approve` | Admin | Approve a doctor |
| PATCH | `/api/admin/doctors/:id/reject` | Admin | Reject/suspend a doctor |

## Key Architecture Decisions

### Slot Generation
Slots are computed **on-the-fly** from the doctor's weekly availability. No empty slots are stored in the database. The algorithm:
1. Find the doctor's schedule for the target weekday
2. Split the time window into `slotDuration`-minute increments
3. Remove booked slots (status = "booked"), leave dates, and past times

### Conflict Prevention
A **partial unique index** on `{doctor, date, startTime}` where `status = "booked"` prevents double-booking at the database level. Cancelled slots are immediately re-bookable.

### Email
All email calls are wrapped in try/catch — booking **never fails** due to email errors. If SMTP is not configured, emails are logged to the console.

### Cron Job
An hourly cron job runs at minute `:00` and sends reminder emails for appointments starting in approximately 24 hours.

## Running Tests

```bash
cd server
npm test
```

Tests use `mongodb-memory-server` for a fully isolated in-memory database.

## Project Structure

```
appointment-system/
├── server/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # Route handlers
│   ├── middleware/                # auth.js, errorHandler.js
│   ├── models/                   # User, Doctor, Appointment
│   ├── routes/                   # Express routers
│   ├── services/                 # slotService, emailService
│   ├── jobs/reminderJob.js       # Cron reminder
│   ├── validation/               # Zod schemas
│   ├── scripts/seed.js           # Database seeder
│   ├── tests/                    # Jest + Supertest
│   └── server.js                 # Express app entry
│
└── client/
    └── src/
        ├── api/axios.js          # Axios with JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/           # Navbar, PrivateRoute, RoleRoute, etc.
        ├── pages/
        │   ├── auth/             # Login, Register
        │   ├── patient/          # Dashboard, Search, Book, History
        │   ├── doctor/           # Dashboard, Availability, Appointments
        │   └── admin/            # Dashboard, ManageDoctors, ManageUsers
        ├── routes/AppRoutes.jsx
        └── App.jsx
```

## License

ISC
