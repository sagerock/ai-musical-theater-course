import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import {
  FolderIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ClockIcon,
  TagIcon,
  ChartBarIcon,
  EyeIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalChats: 0,
    recentChats: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser, userRole, loading: authLoading } = useAuth();
  
  console.log('🔍 Dashboard render - Auth state:', {
    currentUser: currentUser?.id,
    email: currentUser?.email,
    userRole,
    authLoading
  });

  useEffect(() => {
    if (currentUser) {
      console.log('🔄 Dashboard: useEffect triggered, calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('⚠️ Dashboard: useEffect triggered but no currentUser, skipping data load');
      setLoading(false);
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Dashboard: Starting data load...');
      console.log('  - currentUser:', currentUser?.id, currentUser?.email);
      
      if (!currentUser) {
        console.warn('⚠️ Dashboard: No currentUser available, cannot load data');
        setLoading(false);
        return;
      }
      
      // Get user's courses first
      console.log('📊 Dashboard: Getting user courses...');
      const userCourses = await courseApi.getUserCourses(currentUser.id);
      console.log('📊 Dashboard: Raw user courses:', userCourses);
      
      const approvedCourses = userCourses.filter(membership => 
        membership.status === 'approved'
      );
      
      console.log('📊 Dashboard: Approved courses:', approvedCourses.length);
      
      // Aggregate projects and chats across all user's courses
      let allProjects = [];
      let allChats = [];
      
      if (approvedCourses.length > 0) {
        // Load projects from all courses
        const projectPromises = approvedCourses.map(membership =>
          projectApi.getUserProjects(currentUser.id, membership.courses.id)
        );
        const projectResults = await Promise.all(projectPromises);
        allProjects = projectResults.flat();
        
        // Load chats from all courses
        const chatPromises = approvedCourses.map(membership =>
          chatApi.getUserChats(currentUser.id, membership.courses.id, 1000)
        );
        const chatResults = await Promise.all(chatPromises);
        allChats = chatResults.flat();
      } else {
        // Fallback: Load projects and chats without course filter (legacy data)
        console.log('📊 Dashboard: No courses found, loading legacy data');
        allProjects = await projectApi.getUserProjects(currentUser.id);
        allChats = await chatApi.getUserChats(currentUser.id, null, 1000);
      }
      
      console.log('📊 Dashboard data loaded:');
      console.log('  - Projects:', allProjects.length);
      console.log('  - Chats:', allChats.length);
      
      // Sort by date and get recent items
      allProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      allChats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setRecentProjects(allProjects.slice(0, 3));
      setRecentChats(allChats.slice(0, 5));

      // Calculate stats
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentChatsCount = allChats.filter(chat => 
        new Date(chat.created_at) >= sevenDaysAgo
      ).length;

      setStats({
        totalProjects: allProjects.length,
        totalChats: allChats.length,
        recentChats: recentChatsCount
      });

    } catch (error) {
      console.error('❌ Dashboard: Error loading dashboard data:', error);
      console.error('❌ Dashboard: Error details:', error.message, error.code);
      
      // Set default empty data so UI doesn't crash
      setRecentProjects([]);
      setRecentChats([]);
      setStats({
        totalProjects: 0,
        totalChats: 0,
        recentChats: 0
      });
    } finally {
      console.log('📊 Dashboard: Data loading complete, setting loading to false');
      setLoading(false);
    }
  };

  // Debug loading state
  console.log('🔍 Dashboard render state:', {
    loading,
    authLoading,
    currentUser: currentUser?.id,
    userRole,
    recentProjectsLength: recentProjects.length,
    recentChatsLength: recentChats.length
  });

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
                to="/projects"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Create Your First Project
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentChats}</p>
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
              <Link
                to="/projects"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                View all
              </Link>
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
                  <Link
                    to="/projects"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    New Project
                  </Link>
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
                        {format(new Date(chat.created_at), 'MMM dd, HH:mm')}
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