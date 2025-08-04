import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import Footer from './Footer';
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const { currentUser, userRole, isInstructorAnywhere, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const loadUserCourses = useCallback(async () => {
    if (!currentUser?.id) {
      setUserCourses([]);
      return;
    }

    try {
      console.log('🔥 Layout: Firebase user, loading courses from Firebase');
      const courses = await courseApi.getUserCourses(currentUser.id);
      
      console.log('📋 Layout: Loaded courses:', courses.length);
      setUserCourses(courses);
    } catch (error) {
      console.error('Error loading user courses:', error);
      setUserCourses([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadUserCourses();
  }, [currentUser?.id, loadUserCourses]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigation = [
    { name: 'My Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(isInstructorAnywhere 
      ? [{ name: 'Instructor Dashboard', href: '/instructor', icon: ChartBarIcon }] 
      : []),
    ...(userRole === 'admin' 
      ? [{ name: 'Admin Panel', href: '/admin', icon: CogIcon }] 
      : []),
    { name: 'Settings', href: '/settings', icon: CogIcon },
    { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon }
  ];

  // Removed excessive debug logging

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">AI Engagement Hub</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActivePath(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActivePath(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}

            {/* Courses Section */}
            {userCourses.length > 0 && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  My Courses
                </h3>
                <div className="space-y-1">
                  {userCourses.map((courseMembership) => (
                    <div key={courseMembership.id}>
                      {/* Course Overview Link */}
                      <Link
                        key={`course-link-${courseMembership.courses.id}`}
                        to={`/course/${courseMembership.courses.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          location.pathname === `/course/${courseMembership.courses.id}`
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <AcademicCapIcon className={`mr-3 h-5 w-5 ${
                          location.pathname === `/course/${courseMembership.courses.id}` 
                            ? 'text-primary-500' 
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{courseMembership.courses.title}</div>
                          <div className="text-xs text-gray-500">
                            {courseMembership.courses.course_code} • {courseMembership.role}
                          </div>
                        </div>
                      </Link>
                      
                      {/* Course Sub-navigation */}
                      <div key={`course-subnav-${courseMembership.courses.id}`} className="ml-8 mt-1 space-y-1">
                        <Link
                          to={`/course/${courseMembership.courses.id}/projects`}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            location.pathname === `/course/${courseMembership.courses.id}/projects`
                              ? 'bg-primary-50 text-primary-600'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                        >
                          <FolderIcon className="mr-2 h-4 w-4" />
                          Projects
                        </Link>
                        
                        {/* Show Instructor Notes for users with teaching permissions */}
                        {hasTeachingPermissions(courseMembership.role) && (
                          <Link
                            to={`/course/${courseMembership.courses.id}/instructor-notes`}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              location.pathname === `/course/${courseMembership.courses.id}/instructor-notes`
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            <DocumentTextIcon className="mr-2 h-4 w-4" />
                            Instructor Notes
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join Course Link */}
            <div className="pt-2">
              <Link
                to="/join"
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <AcademicCapIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                Join Course
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-50">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 h-screen">
            <div className="flex items-center h-16 px-4 border-b border-gray-200">
              <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">AI Engagement Hub</span>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActivePath(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActivePath(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              ))}

              {/* Courses Section */}
              {userCourses.length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    My Courses
                  </h3>
                  <div className="space-y-1">
                    {userCourses.map((courseMembership) => (
                      <div key={courseMembership.id}>
                        {/* Course Overview Link */}
                        <Link
                          key={`course-link-desktop-${courseMembership.courses.id}`}
                          to={`/course/${courseMembership.courses.id}`}
                          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            location.pathname === `/course/${courseMembership.courses.id}`
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <AcademicCapIcon className={`mr-3 h-5 w-5 ${
                            location.pathname === `/course/${courseMembership.courses.id}` 
                              ? 'text-primary-500' 
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{courseMembership.courses.title}</div>
                            <div className="text-xs text-gray-500">
                              {courseMembership.courses.course_code} • {courseMembership.role}
                            </div>
                          </div>
                        </Link>
                        
                        {/* Course Sub-navigation */}
                        <div key={`course-subnav-desktop-${courseMembership.courses.id}`} className="ml-8 mt-1 space-y-1">
                          <Link
                            to={`/course/${courseMembership.courses.id}/projects`}
                            className={`group flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              location.pathname === `/course/${courseMembership.courses.id}/projects`
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            <FolderIcon className="mr-2 h-4 w-4" />
                            Projects
                          </Link>
                          
                          {/* Show Instructor Notes for users with teaching permissions */}
                          {hasTeachingPermissions(courseMembership.role) && (
                            <Link
                              to={`/course/${courseMembership.courses.id}/instructor-notes`}
                              className={`group flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                location.pathname === `/course/${courseMembership.courses.id}/instructor-notes`
                                  ? 'bg-primary-50 text-primary-600'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <DocumentTextIcon className="mr-2 h-4 w-4" />
                              Instructor Notes
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Join Course Link */}
              <div className="pt-2">
                <Link
                  to="/join"
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <AcademicCapIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Join Course
                </Link>
              </div>
            </nav>
            
            {/* User profile section */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {currentUser?.photoURL ? (
                    <img className="h-8 w-8 rounded-full" src={currentUser.photoURL} alt="" />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Top navigation for mobile */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => isActivePath(item.href))?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {currentUser?.photoURL ? (
                  <img className="h-8 w-8 rounded-full" src={currentUser.photoURL} alt="" />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
} 