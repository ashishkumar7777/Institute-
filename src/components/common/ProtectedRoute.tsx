import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('owner' | 'teacher' | 'student')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  // 1. While checking authentication session, show a clean loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 2. If not logged in at all, kick them back to /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If logged in but user role is not allowed (e.g., student trying to access /teacher or /director)
  if (allowedRoles && !allowedRoles.includes(currentUser.role as any)) {
    // Redirect to their own appropriate portal
    if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (currentUser.role === 'student') return <Navigate to="/student" replace />;
    if (currentUser.role === 'owner') return <Navigate to="/director" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};