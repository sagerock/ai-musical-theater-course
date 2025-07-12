import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Chat from './components/Chat/Chat';
import Projects from './components/Projects/Projects';
import InstructorDashboard from './components/Instructor/InstructorDashboard';
import AdminPanel from './components/Admin/AdminPanel';
import CourseJoin from './components/Course/CourseJoin';
import CourseDashboard from './components/Course/CourseDashboard';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<CourseJoin />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="chat/:projectId" element={<Chat />} />
            <Route path="course/:courseId" element={<CourseDashboard />} />
            <Route path="course/:courseId/projects" element={<Projects />} />
            <Route path="instructor" element={<InstructorRoute><InstructorDashboard /></InstructorRoute>} />
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
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
    return <Navigate to="/" />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  
  if (userRole !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default App; 