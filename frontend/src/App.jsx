import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import OtpVerification from './pages/OtpVerification';

// Faculty Pages
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import BookHall from './pages/BookHall';
import MyBookings from './pages/MyBookings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import HallManagement from './pages/admin/HallManagement';

/**
 * App root — sets up providers, routing, and toast notifications.
 *
 * Route structure:
 * Public:    /login, /register, /verify-otp
 * Faculty:   /dashboard, /calendar, /book, /my-bookings
 * Admin:     /admin, /admin/halls
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
            },
          }}
        />

        <Routes>
          {/* ─── Root redirect ─── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ─── Public / Guest Routes ─── */}
          <Route path="/login" element={
            <GuestRoute><Login /></GuestRoute>
          } />
          <Route path="/register" element={
            <GuestRoute><Register /></GuestRoute>
          } />
          <Route path="/verify-otp" element={<OtpVerification />} />

          {/* ─── Faculty Protected Routes ─── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Sidebar><Dashboard /></Sidebar>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Sidebar><Calendar /></Sidebar>
            </ProtectedRoute>
          } />
          <Route path="/book" element={
            <ProtectedRoute>
              <Sidebar><BookHall /></Sidebar>
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <Sidebar><MyBookings /></Sidebar>
            </ProtectedRoute>
          } />

          {/* ─── Admin Protected Routes ─── */}
          <Route path="/admin" element={
            <AdminRoute>
              <Sidebar><AdminDashboard /></Sidebar>
            </AdminRoute>
          } />
          <Route path="/admin/halls" element={
            <AdminRoute>
              <Sidebar><HallManagement /></Sidebar>
            </AdminRoute>
          } />

          {/* ─── Catch-all ─── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
