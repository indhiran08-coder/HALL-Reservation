import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps pages that require authentication.
 * Redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950">
    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
  </div>;
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

/**
 * AdminRoute — wraps pages that require ADMIN role.
 * Redirects non-admins to /dashboard.
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-950">
    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
  </div>;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * GuestRoute — wraps public pages (login, register).
 * Redirects authenticated users to their dashboard.
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated()) return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  return children;
}
