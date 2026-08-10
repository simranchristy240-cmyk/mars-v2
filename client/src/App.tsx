import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { AmbientBackground } from './components/layout/AmbientBackground';

import { Login } from './pages/Login';
import { StudentDashboard } from './pages/student/Dashboard';
import { Courses } from './pages/student/Courses';
import { CourseDetail } from './pages/student/CourseDetail';
import { Lesson } from './pages/student/Lesson';
import { Practice } from './pages/student/Practice';
import { TestLobby } from './pages/student/TestLobby';
import { TestAttempt } from './pages/student/TestAttempt';
import { TestReport } from './pages/student/TestReport';
import { Reports } from './pages/student/Reports';
import { Achievements } from './pages/student/Achievements';
import { Profile } from './pages/student/Profile';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CourseBuilder } from './pages/admin/CourseBuilder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const StudentRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

const LoginRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;
  return (
    <>
      <AmbientBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Login />
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginRoute />} />

              <Route element={<StudentRoute />}>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/lesson/:id" element={<Lesson />} />
                <Route path="/practice/topic/:topicId" element={<Practice />} />
                <Route path="/tests/course/:courseId" element={<TestLobby />} />
                <Route path="/tests/:id/attempt" element={<TestAttempt />} />
                <Route path="/tests/:id/report" element={<TestReport />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/leaderboard" element={<Achievements />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Profile />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/builder" element={<CourseBuilder />} />
                <Route path="/admin/builder/:courseId" element={<CourseBuilder />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
