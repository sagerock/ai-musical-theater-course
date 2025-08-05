import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi, userApi, schoolsApi, analyticsApi } from '../../services/firebaseApi';
import { 
  AcademicCapIcon, 
  UsersIcon, 
  ChartBarIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function SchoolAdminDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schoolData, setSchoolData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalProjects: 0,
    totalInteractions: 0
  });
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadSchoolData();
  }, [currentUser]);

  const loadSchoolData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      
      // First, get the user's school information
      const userData = await userApi.getUserById(currentUser.id);
      if (!userData.schoolId) {
        toast.error('No school assigned to your account');
        return;
      }

      // Load school information
      const school = await schoolsApi.getSchoolById(userData.schoolId);
      setSchoolData(school);

      // Load all courses for this school
      const allCourses = await courseApi.getAllCourses();
      const schoolCourses = allCourses.filter(course => course.schoolId === userData.schoolId);

      // Calculate statistics
      let totalStudents = 0;
      let totalInstructors = 0;
      let totalProjects = 0;
      let totalInteractions = 0;

      // First calculate membership stats
      schoolCourses.forEach(course => {
        const memberships = course.course_memberships || [];
        totalStudents += memberships.filter(m => m.role === 'student' && m.status === 'approved').length;
        totalInstructors += memberships.filter(m => m.role === 'instructor' && m.status === 'approved').length;
      });

      // Fetch analytics for each course to get project and interaction counts
      const coursesWithAnalytics = await Promise.all(
        schoolCourses.map(async (course) => {
          try {
            const analytics = await analyticsApi.getCourseAnalyticsSummary(course.id);
            return {
              ...course,
              totalProjects: analytics.courseInfo?.totalProjects || 0,
              totalInteractions: analytics.courseInfo?.totalInteractions || 0
            };
          } catch (error) {
            console.warn(`Failed to load analytics for course ${course.id}:`, error);
            return {
              ...course,
              totalProjects: 0,
              totalInteractions: 0
            };
          }
        })
      );
      
      // Set courses with analytics data
      setCourses(coursesWithAnalytics);
      
      // Sum up the analytics data
      coursesWithAnalytics.forEach(course => {
        totalProjects += course.totalProjects;
        totalInteractions += course.totalInteractions;
      });

      setStats({
        totalCourses: schoolCourses.length,
        totalStudents,
        totalInstructors,
        totalProjects,
        totalInteractions
      });

    } catch (error) {
      console.error('Error loading school data:', error);
      toast.error('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!schoolData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <BuildingOffice2Icon className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No School Assigned</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Please contact a global administrator to assign you to a school.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <BuildingOffice2Icon className="h-8 w-8 text-primary-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">{schoolData.name}</h1>
        </div>
        <p className="text-gray-600">School Administrator Dashboard</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-12 w-12 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-12 w-12 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-12 w-12 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Instructors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalInstructors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">AI Interactions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalInteractions.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Courses in {schoolData.name}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Interactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No courses found for this school.
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const instructors = course.course_memberships?.filter(m => m.role === 'instructor' && m.status === 'approved') || [];
                  const students = course.course_memberships?.filter(m => m.role === 'student' && m.status === 'approved') || [];
                  
                  return (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{course.course_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{course.semester} {course.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{instructors.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{students.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.totalProjects || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.totalInteractions?.toLocaleString() || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a 
                          href={`/course/${course.id}`} 
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Course
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}