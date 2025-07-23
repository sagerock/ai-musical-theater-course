import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import PublicHomePage from './components/Home/PublicHomePage';
import Login from './components/Auth/Login';
import ResetPassword from './components/Auth/ResetPassword';
import ConfirmEmail from './components/Auth/ConfirmEmail';
import Dashboard from './components/Dashboard/Dashboard';
import Chat from './components/Chat/Chat';
import Projects from './components/Projects/Projects';
import InstructorDashboardContainer from './components/Instructor/InstructorDashboardContainer';
import InstructorNotesList from './components/Instructor/InstructorNotesList';
import AdminPanel from './components/Admin/AdminPanel';
import CourseJoin from './components/Course/CourseJoin';
import CourseDashboard from './components/Course/CourseDashboard';
import Layout from './components/Layout/Layout';
import PrivacyPolicy from './components/Privacy/PrivacyPolicy';
import SettingsPage from './components/Settings/SettingsPage';
import TestPDFUpload from './components/TestPDFUpload';
import TestDirectQuery from './components/TestDirectQuery';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="App">
          <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirm" element={<ConfirmEmail />} />
          <Route path="/auth/confirm" element={<ConfirmEmail />} />
          <Route path="/join" element={<CourseJoin />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/projects" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Projects />} />
          </Route>
          <Route path="/chat/:projectId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Chat />} />
          </Route>
          <Route path="/course/:courseId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<CourseDashboard />} />
          </Route>
          <Route path="/course/:courseId/projects" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Projects />} />
          </Route>
          <Route path="/course/:courseId/instructor-notes" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<InstructorRoute><InstructorNotesList /></InstructorRoute>} />
          </Route>
          <Route path="/instructor/*" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="*" element={<InstructorRoute><InstructorDashboardContainer /></InstructorRoute>} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
          <Route path="/settings" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<SettingsPage />} />
          </Route>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/test-pdf" element={<TestPDFUpload />} />
          <Route path="/test-direct" element={<TestDirectQuery />} />
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function HomeRoute() {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return currentUser ? <Navigate to="/dashboard" /> : <PublicHomePage />;
}

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" />;
}

function InstructorRoute({ children }) {
  const { currentUser, userRole, isInstructorAnywhere } = useAuth();
  
  if (!isInstructorAnywhere) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

export default App; 