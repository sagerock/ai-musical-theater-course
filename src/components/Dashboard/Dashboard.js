import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, courseApi } from '../../services/firebaseApi';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FolderIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ClockIcon,
  TagIcon,
  ChartBarIcon,
  EyeIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalChats: 0,
    recentChats: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole, loading: authLoading } = useAuth();

  // First approved course for linking "View all" / "New Project"
  const firstCourseId = userCourses[0]?.courses?.id;
  
  // Removed excessive debug logging

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      console.log('📊 Dashboard: Starting data load for', currentUser.id);

      // Get user's courses (already batch-optimized)
      const fetchedCourses = await courseApi.getUserCourses(currentUser.id);
      const approvedCourses = fetchedCourses.filter(m => m.status === 'approved');
      setUserCourses(approvedCourses);

      if (approvedCourses.length === 0) {
        // No courses — try legacy data
        const [legacyProjects, legacyChats] = await Promise.all([
          projectApi.getUserProjects(currentUser.id).catch(() => []),
          (userRole !== 'instructor' && userRole !== 'admin')
            ? chatApi.getUserChats(currentUser.id, null, 5).catch(() => [])
            : Promise.resolve([])
        ]);

        // Get project count server-side
        const projectCountSnap = await getCountFromServer(
          query(collection(db, 'projects'), where('createdBy', '==', currentUser.id))
        ).catch(() => ({ data: () => ({ count: legacyProjects.length }) }));

        setRecentProjects(legacyProjects.slice(0, 3));
        setRecentChats(legacyChats.slice(0, 5));
        setStats({
          totalProjects: projectCountSnap.data().count,
          totalChats: legacyChats.length,
          recentChats: 0
        });
        setLoading(false);
        return;
      }

      const courseIds = approvedCourses.map(m => m.courses.id);
      const isInstructor = userRole === 'instructor' || userRole === 'admin';
      const instructorCourseIds = isInstructor
        ? approvedCourses.filter(m => m.role === 'instructor').map(m => m.courses.id)
        : [];

      // Fire all queries in parallel:
      // 1. Server-side project count (no document downloads)
      // 2. Server-side chat count (no document downloads)
      // 3. Recent 3 projects (small payload)
      // 4. Recent 5 chats (small payload, optimized fetch)
      const projectCountPromise = getCountFromServer(
        query(collection(db, 'projects'), where('createdBy', '==', currentUser.id))
      ).catch(() => ({ data: () => ({ count: 0 }) }));

      // Chat count: students = own chats, instructors = course chats
      let chatCountPromise;
      if (isInstructor && instructorCourseIds.length > 0) {
        // Sum counts across instructor courses (batched in groups of 10)
        chatCountPromise = (async () => {
          let total = 0;
          for (let i = 0; i < instructorCourseIds.length; i += 10) {
            const batch = instructorCourseIds.slice(i, i + 10);
            const counts = await Promise.all(
              batch.map(cId =>
                getCountFromServer(
                  query(collection(db, 'chats'), where('courseId', '==', cId))
                ).then(snap => snap.data().count).catch(() => 0)
              )
            );
            total += counts.reduce((a, b) => a + b, 0);
          }
          return total;
        })();
      } else {
        chatCountPromise = getCountFromServer(
          query(collection(db, 'chats'), where('userId', '==', currentUser.id))
        ).then(snap => snap.data().count).catch(() => 0);
      }

      // Recent projects: just need 3, fetched from first course (already sorted by createdAt desc)
      const recentProjectsPromise = projectApi.getUserProjects(currentUser.id, courseIds[0])
        .catch(() => []);

      // Recent chats: just need 5
      let recentChatsPromise;
      if (isInstructor && instructorCourseIds.length > 0) {
        // Use optimized batch-fetch for first instructor course, limit 5
        recentChatsPromise = chatApi.getChatsWithFiltersOptimized({
          courseId: instructorCourseIds[0],
          limit: 5
        }).catch(() => []);
      } else {
        recentChatsPromise = chatApi.getUserChats(currentUser.id, courseIds[0], 5)
          .catch(() => []);
      }

      const [projectCountSnap, chatCount, projects, chats] = await Promise.all([
        projectCountPromise,
        chatCountPromise,
        recentProjectsPromise,
        recentChatsPromise
      ]);

      setRecentProjects(projects.slice(0, 3));
      setRecentChats(chats.slice(0, 5));
      setStats({
        totalProjects: projectCountSnap.data().count,
        totalChats: chatCount,
        recentChats: 0
      });

      console.log('📊 Dashboard loaded:', {
        projects: projectCountSnap.data().count,
        chats: chatCount,
        recentProjects: projects.length,
        recentChats: chats.length
      });

    } catch (error) {
      console.error('❌ Dashboard: Error loading data:', error);
      setRecentProjects([]);
      setRecentChats([]);
      setStats({ totalProjects: 0, totalChats: 0, recentChats: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    if (currentUser && userRole !== null) {
      console.log('🔄 Dashboard: useEffect triggered, calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('⚠️ Dashboard: useEffect triggered but missing requirements:', {
        hasCurrentUser: !!currentUser,
        userRole: userRole
      });
      setLoading(false);
    }
  }, [currentUser?.id, userRole, loadDashboardData]);

  // Removed excessive debug logging

  if (loading || authLoading) {
    console.log('📊 Dashboard: Showing loading spinner', { loading, authLoading });
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('⚠️ Dashboard: No currentUser, this should not happen in protected route');
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Authentication error. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const isNewUser = stats.totalProjects === 0 && stats.totalChats === 0;

  return (
    <div className="p-6">
      
      {isNewUser ? (
        // New user welcome section
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 mb-8">
            <h1 className="text-3xl font-bold mb-4">
              Welcome to AI Engagement Hub!
            </h1>
            <p className="text-lg mb-6">
              A powerful analytics platform that helps educators understand how students interact with AI in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={firstCourseId ? `/course/${firstCourseId}/projects` : '/join'}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                {firstCourseId ? 'Create Your First Project' : 'Join a Course to Start'}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/join"
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10"
              >
                Join a Course
              </Link>
            </div>
          </div>

          {/* Key Features for New Users */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Why AI Engagement Hub?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-md">
                    <EyeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Real-time Monitoring</h3>
                </div>
                <p className="text-gray-600">Track student interactions with AI models as they happen, providing immediate insights into usage patterns.</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-green-100 rounded-md">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Rich Analytics</h3>
                </div>
                <p className="text-gray-600">Visualize engagement patterns, model preferences, and usage trends through intuitive dashboards.</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Learning Support</h3>
                </div>
                <p className="text-gray-600">Enable structured reflection on AI interactions to deepen understanding and improve outcomes.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Existing user dashboard
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentUser?.displayName || currentUser?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your AI interactions.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <FolderIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
              {firstCourseId ? (
                <Link
                  to={`/course/${firstCourseId}/projects`}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  View all
                </Link>
              ) : (
                <Link
                  to="/join"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Join a course
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.title}</p>
                        <p className="text-xs text-gray-500">
                          Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/chat/${project.id}`}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <div className="mt-6">
                  {firstCourseId ? (
                    <Link
                      to={`/course/${firstCourseId}/projects`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      New Project
                    </Link>
                  ) : (
                    <Link
                      to="/join"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Join a Course
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Chat Activity */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentChats.length > 0 ? (
              <div className="space-y-4">
                {recentChats.map((chat) => (
                  <div key={chat.id} className="border-l-4 border-primary-200 pl-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-xs text-gray-500">{chat.tool_used}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {chat.created_at && !isNaN(new Date(chat.created_at)) ? 
                          format(new Date(chat.created_at), 'MMM dd, HH:mm') : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                      {chat.prompt.length > 100 ? `${chat.prompt.substring(0, 100)}...` : chat.prompt}
                    </p>
                    {chat.projects && (
                      <p className="text-xs text-gray-500 mt-1">
                        Project: {chat.projects.title}
                      </p>
                    )}
                    {chat.chat_tags && chat.chat_tags.length > 0 && (
                      <div className="flex items-center mt-2">
                        <TagIcon className="h-3 w-3 text-gray-400 mr-1" />
                        <div className="flex space-x-1">
                          {chat.chat_tags.slice(0, 3).map((chatTag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {chatTag.tags.name}
                            </span>
                          ))}
                          {chat.chat_tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{chat.chat_tags.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No chat activity yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start a conversation with AI to see your activity here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 