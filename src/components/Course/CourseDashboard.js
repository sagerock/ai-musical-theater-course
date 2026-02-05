import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/firebaseApi';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { diagnoseCourseProjects } from '../../utils/diagnostics';
import { repairProjectCourseIds } from '../../utils/dataRepair';
import {
  AcademicCapIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

export default function CourseDashboard() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [courseMembers, setCourseMembers] = useState([]);
  const [courseStats, setCourseStats] = useState({
    instructorCount: 0,
    studentCount: 0,
    projectCount: 0,
    conversationCount: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole, isInstructorAnywhere } = useAuth();

  useEffect(() => {
    loadCourseData();
  }, [courseId]);


  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Get course info first
      const courseData = await courseApi.getCourseById(courseId);
      setCourse(courseData);

      // Fire all queries in parallel
      const isInstructor = userRole === 'instructor' || isInstructorAnywhere;

      // Server-side counts for projects and chats (zero document downloads)
      const projectCountPromise = getCountFromServer(
        query(collection(db, 'projects'), where('courseId', '==', courseId))
      ).then(snap => snap.data().count).catch(() => 0);

      const chatCountPromise = getCountFromServer(
        query(collection(db, 'chats'), where('courseId', '==', courseId))
      ).then(snap => snap.data().count).catch(() => 0);

      // Members: only fetch for instructors (students use cached counts from course doc)
      const membersPromise = isInstructor
        ? courseApi.getCourseMembers(courseId).catch(() => [])
        : Promise.resolve([]);

      const [projectCount, chatCount, members] = await Promise.all([
        projectCountPromise,
        chatCountPromise,
        membersPromise
      ]);

      // Compute member stats
      let instructorCount = 0;
      let studentCount = 0;

      if (isInstructor && members.length > 0) {
        setCourseMembers(members);
        instructorCount = members.filter(m => m.role === 'instructor' && m.status === 'approved').length;
        studentCount = members.filter(m => m.role === 'student' && m.status === 'approved').length;
      } else {
        setCourseMembers([]);
        instructorCount = courseData?.instructorCount || 0;
        studentCount = courseData?.studentCount || 0;
      }

      setCourseStats({
        instructorCount,
        studentCount,
        projectCount,
        conversationCount: chatCount
      });

      console.log('📊 Course stats loaded:', { instructorCount, studentCount, projectCount, chatCount });

    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Course not found</h2>
          <p className="text-gray-600 mt-2">The course you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const instructors = courseMembers.filter(m => m.role === 'instructor');
  const students = courseMembers.filter(m => m.role === 'student');
  
  // Diagnostic function for debugging projects issue
  const runDiagnostics = async () => {
    try {
      console.log('🔧 Running diagnostics for course:', courseId);
      const results = await diagnoseCourseProjects(courseId);
      console.log('📊 Diagnostic Results:', results);
      
      // Show results in an alert for now
      const needsRepair = results.projectsWithCourse_id > 0 || results.orphanedChats.length > 0;
      
      alert(`
Course Diagnostics for ${course.title}:
- Projects with courseId field: ${results.projectsWithCourseId}
- Projects with course_id field: ${results.projectsWithCourse_id}
- Total chats: ${results.totalChats}
- Orphaned chats: ${results.orphanedChats.length}

${needsRepair ? 'Issues detected! Would you like to run the repair tool?' : 'No issues detected.'}

Check browser console for detailed information.
      `);
      
      if (needsRepair && window.confirm('Run repair tool to fix project courseId issues?')) {
        try {
          const repairResult = await repairProjectCourseIds();
          alert(`Repair completed! Fixed ${repairResult.repairedCount} out of ${repairResult.totalProjects} projects.`);
          
          // Reload course data to reflect the fix
          await loadCourseData();
        } catch (error) {
          console.error('Repair error:', error);
          alert('Error running repair. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      alert('Error running diagnostics. Check console for details.');
    }
  };

  return (
    <div className="p-6">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium mr-2">
                {course.course_code}
              </span>
              <span>{course.semester} {course.year}</span>
            </div>
          </div>
        </div>
        {course.description && (
          <p className="text-gray-600 max-w-3xl">{course.description}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{courseStats.instructorCount}</p>
              <p className="text-sm text-gray-600">Instructors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{courseStats.studentCount}</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{courseStats.projectCount}</p>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{courseStats.conversationCount}</p>
              <p className="text-sm text-gray-600">Conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Members - Only show detailed lists to instructors */}
      {(userRole === 'instructor' || isInstructorAnywhere) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructors */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Instructors</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {instructors.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No instructors yet
              </div>
            ) : (
              instructors.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <AcademicCapIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {member.users?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.users?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Students</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {students.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No students yet
              </div>
            ) : (
              students.map((member) => (
                <div key={member.id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {member.users?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.users?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      )}

      {/* Course Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Course created {(() => {
              // Check both createdAt and created_at for compatibility
              const timestamp = course.createdAt || course.created_at;
              if (!timestamp) return 'Unknown date';
              
              // Handle Firestore timestamp
              const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
              
              if (isNaN(date.getTime())) return 'Unknown date';
              
              return format(date, 'MMMM dd, yyyy');
            })()}
          </div>
          
          {/* Diagnostic button - only visible to instructors and admins */}
          {(userRole === 'instructor' || userRole === 'admin' || userRole === 'school_administrator') && (
            <button
              onClick={runDiagnostics}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              title="Run diagnostics to debug project count issues"
            >
              <WrenchScrewdriverIcon className="h-3 w-3 mr-1" />
              Diagnostics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}