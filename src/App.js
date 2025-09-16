import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { hasStudentAssistantPermissions } from './utils/roleUtils';
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
import Students from './components/Instructor/Students';
import StudentLibraryWrapper from './components/Student/StudentLibraryWrapper';
import InstructorLibraryWrapper from './components/Instructor/InstructorLibraryWrapper';
import CourseAnnouncements from './components/Announcements/CourseAnnouncements';
import AdminPanel from './components/Admin/AdminPanel';
import SchoolAdminDashboard from './components/SchoolAdmin/SchoolAdminDashboard';
import CourseJoin from './components/Course/CourseJoin';
import CourseDashboard from './components/Course/CourseDashboard';
import Layout from './components/Layout/Layout';
import PrivacyPolicy from './components/Privacy/PrivacyPolicy';
import Pricing from './components/Pricing/Pricing';
import FAQ from './components/FAQ/FAQ';
import SettingsPage from './components/Settings/SettingsPage';
import Help from './components/Help/Help';
import TestDirectQuery from './components/TestDirectQuery';
import EmailServerTest from './components/Testing/EmailServerTest';

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
          <Route path="/chat/:projectId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Chat />} />
          </Route>
          <Route path="/course/:courseId" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<CourseDashboard />} />
          </Route>
          <Route path="/course/:courseId/projects" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Projects />} />
          </Route>
          <Route path="/course/:courseId/library" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<StudentLibraryWrapper />} />
          </Route>
          <Route path="/course/:courseId/instructor-library" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<InstructorRoute><InstructorLibraryWrapper /></InstructorRoute>} />
          </Route>
          <Route path="/course/:courseId/announcements" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<CourseAnnouncements />} />
          </Route>
          <Route path="/course/:courseId/instructor-notes" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<InstructorRoute><InstructorNotesList /></InstructorRoute>} />
          </Route>
          <Route path="/course/:courseId/students" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<StudentAssistantRoute><StudentsPageWrapper /></StudentAssistantRoute>} />
          </Route>
          <Route path="/instructor/*" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="*" element={<InstructorRoute><InstructorDashboardContainer /></InstructorRoute>} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Route>
          <Route path="/school-admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<SchoolAdminRoute><SchoolAdminDashboard /></SchoolAdminRoute>} />
          </Route>
          <Route path="/settings" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<SettingsPage />} />
          </Route>
          <Route path="/help" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Help />} />
          </Route>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/test-direct" element={<TestDirectQuery />} />
          <Route path="/test-email" element={<EmailServerTest />} />
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

function SchoolAdminRoute({ children }) {
  const { currentUser, userRole, isSchoolAdministrator } = useAuth();
  
  if (!isSchoolAdministrator) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function StudentAssistantRoute({ children }) {
  const { currentUser, userRole, isInstructorAnywhere } = useAuth();
  const { courseId } = useParams();
  const [hasAccess, setHasAccess] = React.useState(null);
  
  React.useEffect(() => {
    const checkAccess = async () => {
      // Instructors always have access
      if (isInstructorAnywhere) {
        setHasAccess(true);
        return;
      }
      
      // Check course-specific membership
      if (courseId && currentUser) {
        try {
          const courseApi = await import('./services/firebaseApi').then(m => m.courseApi);
          const userCourses = await courseApi.getUserCourses(currentUser.id);
          const courseMembership = userCourses.find(membership => 
            membership.courses.id === courseId
          );
          
          if (courseMembership && hasStudentAssistantPermissions(courseMembership.role)) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } catch (error) {
          console.error('Error checking course access:', error);
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
    };
    
    checkAccess();
  }, [courseId, currentUser, isInstructorAnywhere]);
  
  if (hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!hasAccess) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function StudentsPageWrapper() {
  const { currentUser } = useAuth();
  const { courseId } = useParams();
  const [course, setCourse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  // Load course info
  React.useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      try {
        const courseApi = await import('./services/firebaseApi').then(m => m.courseApi);
        const courseData = await courseApi.getCourseById(courseId);
        setCourse({ courses: courseData });
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <Students 
        selectedCourseId={courseId}
        selectedCourse={course}
        currentUser={currentUser}
      />
    </div>
  );
}

export default App; 