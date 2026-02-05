import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, chatApi } from '../../services/firebaseApi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
import { AcademicCapIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function InstructorDashboardContainer() {
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Course creation state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    semester: 'Spring',
    year: new Date().getFullYear(),
    schoolId: ''
  });
  
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
      
      // Load all course data for export using optimized batch fetching
      const chats = await chatApi.getChatsWithFiltersOptimized({
        courseId: selectedCourseId,
        limit: 1000
      }).catch(() => []);

      // Batch-fetch tags and instructor notes for all chats
      const chatIds = chats.map(c => c.id);
      const projectIds = [...new Set(chats.map(c => c.projectId).filter(Boolean))];

      // Batch-fetch chatTags by chatId (groups of 10)
      const chatTagsMap = new Map();
      for (let i = 0; i < chatIds.length; i += 10) {
        const batch = chatIds.slice(i, i + 10);
        try {
          const tagsQuery = query(collection(db, 'chatTags'), where('chatId', 'in', batch));
          const tagsSnapshot = await getDocs(tagsQuery);

          // Collect unique tag IDs for batch-fetching tag details
          const tagIdsToFetch = new Set();
          const rawChatTags = [];
          tagsSnapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            rawChatTags.push(data);
            if (data.tagId) tagIdsToFetch.add(data.tagId);
          });

          // Batch-fetch tag details
          const tagDetailsMap = new Map();
          const tagIdArray = Array.from(tagIdsToFetch);
          for (let j = 0; j < tagIdArray.length; j += 10) {
            const tagBatch = tagIdArray.slice(j, j + 10);
            const tagQuery = query(collection(db, 'tags'), where('__name__', 'in', tagBatch));
            const tagSnapshot = await getDocs(tagQuery);
            tagSnapshot.forEach(doc => {
              tagDetailsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
          }

          // Assemble enriched chat tags
          for (const ct of rawChatTags) {
            if (!chatTagsMap.has(ct.chatId)) chatTagsMap.set(ct.chatId, []);
            chatTagsMap.get(ct.chatId).push({
              ...ct,
              tags: tagDetailsMap.get(ct.tagId) || { name: 'Unknown Tag' }
            });
          }
        } catch (error) {
          console.warn('Error batch-fetching chat tags:', error);
        }
      }

      // Batch-fetch instructor notes by projectId (groups of 10)
      const notesMap = new Map(); // keyed by projectId
      for (let i = 0; i < projectIds.length; i += 10) {
        const batch = projectIds.slice(i, i + 10);
        try {
          const notesQuery = query(collection(db, 'instructorNotes'), where('projectId', 'in', batch));
          const notesSnapshot = await getDocs(notesQuery);
          notesSnapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            if (!notesMap.has(data.projectId)) notesMap.set(data.projectId, []);
            notesMap.get(data.projectId).push(data);
          });
        } catch (error) {
          console.warn('Error batch-fetching instructor notes:', error);
        }
      }

      // Enrich chats with batch-fetched tags and notes
      const enrichedChats = chats.map(chat => ({
        ...chat,
        chat_tags: chatTagsMap.get(chat.id) || [],
        instructor_notes: chat.projectId ? (notesMap.get(chat.projectId) || []) : []
      }));

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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    try {
      // Generate course code
      const courseCode = await courseApi.generateCourseCode(
        newCourse.name,
        newCourse.semester,
        newCourse.year
      );
      
      // Create course data
      const courseData = {
        title: newCourse.name,  // Map name to title for database
        description: newCourse.description,
        semester: newCourse.semester,
        year: newCourse.year,
        course_code: courseCode,
        schoolId: newCourse.schoolId || null,
        createdBy: currentUser.id  // Firebase uses createdBy
      };
      
      // Create the course
      const createdCourse = await courseApi.createCourse(courseData);
      
      // Automatically add the instructor as a member of the new course
      await courseApi.addUserToCourse(
        currentUser.id,
        createdCourse.id,
        'instructor',
        currentUser.id
      );
      
      toast.success(`Course created successfully! Code: ${courseCode}`);
      setShowCreateCourseModal(false);
      setNewCourse({
        name: '',
        description: '',
        semester: 'Spring',
        year: new Date().getFullYear(),
        schoolId: ''
      });
      
      // Reload courses to include the new one
      await loadInstructorCourses();
      // Select the newly created course
      setSelectedCourseId(createdCourse.id);
    } catch (error) {
      console.error('Error creating course:', error);
      
      // Provide specific error messages based on the error type
      if (error.message && error.message.includes('already exists')) {
        toast.error(error.message, { duration: 6000 });
      } else if (error.message && error.message.includes('Missing or insufficient permissions')) {
        toast.error('Permission denied. You may not have the required permissions to create courses. Please contact an administrator.', { duration: 5000 });
      } else if (error.message && error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.', { duration: 4000 });
      } else {
        toast.error(`Failed to create course: ${error.message || 'Unknown error'}`, { duration: 5000 });
      }
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor student projects, AI interactions, and manage course content.
            </p>
          </div>
          <button
            onClick={() => setShowCreateCourseModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Course
          </button>
        </div>
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

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateCourseModal(false)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
              
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourse.name}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Introduction to AI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Course description (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      required
                      value={newCourse.year}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourseModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}