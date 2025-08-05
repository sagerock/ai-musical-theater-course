import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, chatApi, tagApi, instructorNotesApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import InstructorNavigation from './InstructorNavigation';
import CourseSelector from './CourseSelector';
import Overview from './Overview';
import StudentActivity from './StudentActivity';
import Students from './Students';
import InstructorMessaging from '../Messaging/InstructorMessaging';
import FileManagement from './FileManagement';
import CourseManagement from './CourseManagement';
import AIAssistant from './AIAssistant';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function InstructorDashboardContainer() {
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const { currentUser, isInstructorAnywhere } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loadInstructorCourses = useCallback(async () => {
    try {
      setLoading(true);
      
      const userCourses = await courseApi.getUserCourses(currentUser.id);
      const instructorCourses = userCourses.filter(membership => 
        hasTeachingPermissions(membership.role) && membership.status === 'approved'
      );
      
      setInstructorCourses(instructorCourses);
      
      // Auto-select first course if available
      if (instructorCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(instructorCourses[0].courses.id);
      }
    } catch (error) {
      console.error('Error loading instructor courses:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, selectedCourseId]);

  useEffect(() => {
    if (isInstructorAnywhere && currentUser?.id) {
      loadInstructorCourses();
    }
  }, [currentUser?.id, isInstructorAnywhere, loadInstructorCourses]);

  // Auto-navigate to overview if on base instructor route
  useEffect(() => {
    if (location.pathname === '/instructor') {
      navigate('/instructor/overview');
    }
  }, [location.pathname, navigate]);

  const handleCourseChange = (courseId) => {
    setCourseLoading(true);
    setSelectedCourseId(courseId);
    // Small delay to show loading state
    setTimeout(() => setCourseLoading(false), 300);
  };

  const handleExportData = async () => {
    if (!selectedCourseId) return;
    
    try {
      setExporting(true);
      
      // Load all course data for export
      const [chats] = await Promise.all([
        chatApi.getChatsWithFilters({
          courseId: selectedCourseId,
          limit: 1000
        }).catch(() => [])
      ]);

      // Enrich chats with tags and instructor notes
      const enrichedChats = await Promise.all(
        chats.map(async (chat) => {
          try {
            // Load tags for this chat
            const chatTags = await tagApi.getChatTags(chat.id).catch(() => []);
            
            // Load instructor notes for this chat
            const instructorNotes = await instructorNotesApi.getNotesByChat(chat.id).catch(() => []);
            
            return {
              ...chat,
              chat_tags: chatTags,
              instructor_notes: instructorNotes
            };
          } catch (error) {
            console.warn(`Error enriching chat ${chat.id}:`, error);
            return {
              ...chat,
              chat_tags: [],
              instructor_notes: []
            };
          }
        })
      );

      // Prepare data for export
      const dataToExport = enrichedChats.map(chat => ({
        id: chat.id,
        user_name: chat.users?.name || 'Unknown',
        user_email: chat.users?.email || 'Unknown',
        project_title: chat.projects?.title || 'Unknown',
        tool_used: chat.tool_used || 'Claude Sonnet 4',
        prompt: chat.prompt,
        response: chat.response,
        tags: chat.chat_tags?.map(ct => ct.tags?.name || ct.name).join(', ') || '',
        has_reflection: chat.reflections && chat.reflections.length > 0 ? 'Yes' : 'No',
        reflection_content: chat.reflections?.[0]?.content || '',
        instructor_notes: chat.instructor_notes?.map(note => `${note.title}: ${note.content}`).join(' | ') || '',
        created_at: format(new Date(chat.created_at), 'yyyy-MM-dd HH:mm:ss')
      }));

      // Convert to CSV
      const headers = [
        'ID', 'User Name', 'User Email', 'Project', 'AI Tool', 'Prompt', 'Response', 
        'Tags', 'Has Reflection', 'Reflection', 'Instructor Notes', 'Created At'
      ];
      
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          Object.values(row).map(field => 
            `"${String(field).replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const courseCode = selectedCourse?.courses?.course_code || 'course';
      link.setAttribute('download', `${courseCode}_ai_interactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Data exported successfully! ${dataToExport.length} AI interactions exported.`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleManageTags = () => {
    navigate('/instructor/course-settings');
  };

  const handleCourseUpdated = async () => {
    // Refresh course data after course changes
    await loadInstructorCourses();
  };

  const selectedCourse = instructorCourses.find(c => c.courses.id === selectedCourseId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!isInstructorAnywhere) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be an instructor in at least one course to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (instructorCourses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Courses Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You do not have teaching permissions in any courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitor student projects, AI interactions, and manage course content.
        </p>
      </div>

      {/* Course Selection */}
      <CourseSelector
        courses={instructorCourses}
        selectedCourseId={selectedCourseId}
        onCourseChange={handleCourseChange}
        selectedCourse={selectedCourse}
        loading={courseLoading}
        exporting={exporting}
        onExportData={handleExportData}
        onManageTags={handleManageTags}
      />

      {/* Navigation */}
      <InstructorNavigation />

      {/* Main Content */}
      <div className="mt-6">
        {courseLoading ? (
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (
          <Routes>
            <Route path="overview" element={
              <Overview 
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
              />
            } />
            <Route path="activity" element={
              <StudentActivity 
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
              />
            } />
            <Route path="students" element={
              <Students
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
              />
            } />
            <Route path="messaging" element={
              <InstructorMessaging />
            } />
            <Route path="files" element={
              <FileManagement 
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
              />
            } />
            <Route path="course-settings" element={
              <CourseManagement 
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
                onCourseUpdated={handleCourseUpdated}
              />
            } />
            <Route path="ai-assistant" element={
              <AIAssistant
                selectedCourseId={selectedCourseId}
                selectedCourse={selectedCourse}
                currentUser={currentUser}
              />
            } />
          </Routes>
        )}
      </div>

    </div>
  );
}