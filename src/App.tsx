import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { NoticeProvider } from './context/NoticeContext';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const RoleBasedRedirect: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Loading Portal Session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'owner') return <Navigate to="/owner" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LibraryProvider>
          <NoticeProvider>
            <Routes>
              {/* Root redirect handles automatic routing based on active session */}
              <Route path="/" element={<RoleBasedRedirect />} />

              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Owner/Director portal */}
              <Route
                path="/owner"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Teacher portal */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Student portal */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NoticeProvider>
        </LibraryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}