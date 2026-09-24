import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';
import RoleRoute from '../components/RoleRoute';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Patient pages
import PatientDashboard from '../pages/patient/PatientDashboard';
import SearchDoctors from '../pages/patient/SearchDoctors';
import BookAppointment from '../pages/patient/BookAppointment';
import AppointmentHistory from '../pages/patient/AppointmentHistory';

// Doctor pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import Availability from '../pages/doctor/Availability';
import DoctorAppointments from '../pages/doctor/Appointments';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageDoctors from '../pages/admin/ManageDoctors';
import ManageUsers from '../pages/admin/ManageUsers';

// Role-based redirect from root
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const dest = { patient: '/patient', doctor: '/doctor', admin: '/admin' }[user.role] || '/login';
  return <Navigate to={dest} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient routes */}
        <Route path="/patient" element={<PrivateRoute><RoleRoute role="patient"><PatientDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/search" element={<PrivateRoute><RoleRoute role="patient"><SearchDoctors /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute><RoleRoute role="patient"><AppointmentHistory /></RoleRoute></PrivateRoute>} />
        <Route path="/patient/book/:doctorId" element={<PrivateRoute><RoleRoute role="patient"><BookAppointment /></RoleRoute></PrivateRoute>} />

        {/* Doctor routes */}
        <Route path="/doctor" element={<PrivateRoute><RoleRoute role="doctor"><DoctorDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/doctor/appointments" element={<PrivateRoute><RoleRoute role="doctor"><DoctorAppointments /></RoleRoute></PrivateRoute>} />
        <Route path="/doctor/availability" element={<PrivateRoute><RoleRoute role="doctor"><Availability /></RoleRoute></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<PrivateRoute><RoleRoute role="admin"><AdminDashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/admin/doctors" element={<PrivateRoute><RoleRoute role="admin"><ManageDoctors /></RoleRoute></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute><RoleRoute role="admin"><ManageUsers /></RoleRoute></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <h1 className="gradient-text" style={{ fontSize: '4rem' }}>404</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Page not found.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
