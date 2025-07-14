import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import PublicHomePage from './components/Home/PublicHomePage';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Chat from './components/Chat/Chat';
import Projects from './components/Projects/Projects';
import InstructorDashboard from './components/Instructor/InstructorDashboard';
import InstructorNotesList from './components/Instructor/InstructorNotesList';
import AdminPanel from './components/Admin/AdminPanel';
import CourseJoin from './components/Course/CourseJoin';
import CourseDashboard from './components/Course/CourseDashboard';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
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
          <Route path="/instructor" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
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