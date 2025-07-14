import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi, projectApi, userApi, tagApi, analyticsApi, courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SessionDetailModal from './SessionDetailModal';
import InstructorAIChat from './InstructorAIChat';
import TagManagement from './TagManagement';
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  DocumentTextIcon,
  SparklesIcon,
  AcademicCapIcon,
  TagIcon
} from '@heroicons/react/24/outline';

export default function InstructorDashboard() {
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [stats, setStats] = useState({
    totalChats: 0,
    totalUsers: 0,
    totalProjects: 0,
    reflectionCompletionRate: 0
  });
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    projectId: '',
    toolUsed: '',
    tagId: '',
    startDate: '',
    endDate: '',
    hasReflection: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);

  const { currentUser, userRole, isInstructorAnywhere } = useAuth();
  const [fixingChats, setFixingChats] = useState(false);

  useEffect(() => {
    if (isInstructorAnywhere) {
      loadInstructorCourses();
    }
  }, [currentUser, isInstructorAnywhere]);

  useEffect(() => {
    if (selectedCourseId) {
      loadDashboardData();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    // Reload data when significant filters change to optimize backend queries
    if (selectedCourseId) {
      setFiltersLoading(true);
      loadDashboardData().finally(() => setFiltersLoading(false));
    }
  }, [filters.userId, filters.projectId, filters.toolUsed, filters.startDate, filters.endDate]);

  useEffect(() => {
    applyFilters();
  }, [chats, filters.tagId, filters.hasReflection]); // Only apply client-side for tag and reflection filters

  const loadInstructorCourses = async () => {
    try {
      const userCourses = await courseApi.getUserCourses(currentUser.uid);
      const instructorCourses = userCourses.filter(membership => 
        membership.role === 'instructor' && membership.status === 'approved'
      );
      
      setInstructorCourses(instructorCourses);
      
      // Auto-select first course if available
      if (instructorCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(instructorCourses[0].courses.id);
      }
    } catch (error) {
      console.error('Error loading instructor courses:', error);
      toast.error('Failed to load courses');
    }
  };

  const loadDashboardData = async () => {
    if (!selectedCourseId) return;
    
    try {
      setLoading(true);
      
      console.log('🎯 InstructorDashboard.loadDashboardData - selectedCourseId:', selectedCourseId);
      console.log('🎯 InstructorDashboard.loadDashboardData - selectedCourseId type:', typeof selectedCourseId);
      
      // Prepare backend filters (excluding tag and reflection filters which are handled client-side)
      const backendFilters = {
        courseId: selectedCourseId,
        limit: 1000,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.toolUsed && { toolUsed: filters.toolUsed }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      console.log('🔍 Backend filters being applied:', backendFilters);

      // Load all data in parallel for the selected course
      const [
        overallStats,
        allChats,
        allProjects,
        allUsers,
        allTags
      ] = await Promise.all([
        analyticsApi.getOverallStats(selectedCourseId),
        chatApi.getChatsWithFilters(backendFilters),
        projectApi.getAllProjects(selectedCourseId),
        userApi.getAllUsers(selectedCourseId),
        tagApi.getAllTags(selectedCourseId)
      ]);

      console.log('📊 Dashboard data loaded:');
      console.log('  - overallStats:', overallStats);
      console.log('  - allChats length:', allChats?.length || 0);
      console.log('  - allProjects length:', allProjects?.length || 0);
      console.log('  - allUsers length:', allUsers?.length || 0);
      console.log('  - allTags length:', allTags?.length || 0);
      console.log('  - Selected course ID:', selectedCourseId);
      
      if (allChats?.length === 0) {
        console.log('💡 No AI interactions found. This could be because:');
        console.log('  1. No students have joined this course yet');
        console.log('  2. Students haven\'t used AI tools yet');
        console.log('  3. All interactions are from before course assignments');
      }

      setStats(overallStats);
      setChats(allChats);
      setProjects(allProjects);
      // Filter users by course-specific role (course_role) instead of global role
      setUsers(allUsers.filter(user => (user.course_role || user.role) === 'student'));
      setTags(allTags);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...chats];

    // Apply tag filter (client-side only, since it involves joined data)
    if (filters.tagId) {
      console.log('🏷️ Applying client-side tag filter for tagId:', filters.tagId, 'type:', typeof filters.tagId);
      
      // Debug: Log some sample chat_tags structure
      if (filtered.length > 0) {
        const sampleChat = filtered.find(chat => chat.chat_tags && chat.chat_tags.length > 0);
        if (sampleChat) {
          console.log('🏷️ Sample chat_tags structure:', sampleChat.chat_tags.slice(0, 2));
        }
      }
      
      filtered = filtered.filter(chat => {
        if (!chat.chat_tags || chat.chat_tags.length === 0) {
          return false;
        }
        
        const hasMatchingTag = chat.chat_tags.some(ct => {
          if (!ct.tags || !ct.tags.id) {
            console.warn('🏷️ Warning: Invalid tag structure in chat_tags:', ct);
            return false;
          }
          
          // Handle both string and number IDs
          const tagId = ct.tags.id;
          const filterTagId = filters.tagId;
          const match = tagId == filterTagId; // Use == for loose comparison
          
          if (match) {
            console.log('🏷️ Tag match found:', tagId, '==', filterTagId);
          }
          
          return match;
        });
        
        return hasMatchingTag;
      });
      console.log('🏷️ After tag filter, found', filtered.length, 'chats');
    }

    // Apply reflection filter (client-side only)
    if (filters.hasReflection) {
      console.log('💭 Applying client-side reflection filter for hasReflection:', filters.hasReflection);
      const hasReflection = filters.hasReflection === 'true';
      filtered = filtered.filter(chat => 
        hasReflection ? (chat.reflections && chat.reflections.length > 0) : 
                       (!chat.reflections || chat.reflections.length === 0)
      );
      console.log('💭 After reflection filter, found', filtered.length, 'chats');
    }

    console.log('🔍 Final filtered results:', filtered.length, 'of', chats.length, 'chats');
    setFilteredChats(filtered);
  };

  const handleFilterChange = (key, value) => {
    console.log('🔧 Filter change:', key, '=', value, '(type:', typeof value, ')');
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      projectId: '',
      toolUsed: '',
      tagId: '',
      startDate: '',
      endDate: '',
      hasReflection: ''
    });
  };

  const exportData = async () => {
    try {
      setExporting(true);
      
      const dataToExport = filteredChats.map(chat => ({
        id: chat.id,
        user_name: chat.users?.name || 'Unknown',
        user_email: chat.users?.email || 'Unknown',
        project_title: chat.projects?.title || 'Unknown',
        tool_used: chat.tool_used,
        prompt: chat.prompt,
        response: chat.response,
        tags: chat.chat_tags?.map(ct => ct.tags.name).join(', ') || '',
        has_reflection: chat.reflections && chat.reflections.length > 0 ? 'Yes' : 'No',
        reflection_content: chat.reflections?.[0]?.content || '',
        created_at: format(new Date(chat.created_at), 'yyyy-MM-dd HH:mm:ss')
      }));

      // Convert to CSV
      const headers = [
        'ID', 'User Name', 'User Email', 'Project', 'AI Tool', 'Prompt', 'Response', 
        'Tags', 'Has Reflection', 'Reflection', 'Created At'
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
      link.setAttribute('download', `ai_interactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Get unique AI tools for filter
  const aiTools = [...new Set(chats.map(chat => chat.tool_used))];

  const handleFixChatLinkage = async () => {
    try {
      setFixingChats(true);
      const result = await courseApi.fixChatCourseLinkage();
      if (result.fixed > 0) {
        toast.success(`Fixed ${result.fixed} AI interactions! Refreshing dashboard...`);
        loadDashboardData(); // Reload data to show the fixed interactions
      } else {
        toast.success('No AI interactions needed fixing');
      }
    } catch (error) {
      console.error('Error fixing chat linkage:', error);
      toast.error('Failed to fix AI interactions');
    } finally {
      setFixingChats(false);
    }
  };

  // Handle clicking on a chat session
  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChat(null);
  };

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

  const selectedCourse = instructorCourses.find(c => c.courses.id === selectedCourseId);

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
            You are not currently an instructor in any courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitor student projects, AI interactions, and export course data for analysis.
        </p>
      </div>

      {/* Course Selection */}
      {instructorCourses.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Viewing Course:</label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {instructorCourses.map((courseMembership) => (
                <option key={courseMembership.courses.id} value={courseMembership.courses.id}>
                  {courseMembership.courses.name} ({courseMembership.courses.course_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Current Course Info */}
      {selectedCourse && (
        <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-primary-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-primary-900">
                  {selectedCourse.courses.name}
                </h3>
                <p className="text-xs text-primary-700">
                  {selectedCourse.courses.course_code} • {selectedCourse.courses.semester} {selectedCourse.courses.year}
                </p>
              </div>
            </div>
            
            {/* Course-specific Actions */}
            <div className="flex items-center space-x-3">
              {/* Legacy sync button (should no longer be needed after fix) */}
              {stats.totalChats === 0 && (
                <button
                  onClick={handleFixChatLinkage}
                  disabled={fixingChats}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                  title="Legacy: Fix any unlinked AI interactions from before the course linking fix"
                >
                  <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                  {fixingChats ? 'Fixing...' : 'Fix Legacy Data'}
                </button>
              )}
              <button
                onClick={() => setShowTagManagement(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                Manage Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">
              <FolderIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Student Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
              {stats.totalChats === 0 && (
                <p className="text-xs text-gray-500">Students haven't used AI yet</p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Student Projects Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Projects</h2>
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {projects.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <FolderIcon className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {format(new Date(project.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="truncate">
                            {project.users?.name || 'Unknown'} • {project.users?.email}
                          </span>
                        </div>
                        {project.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <Link
                        to={`/chat/${project.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                      >
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Students haven't created any projects in this course yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Interactions Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">AI Interactions</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-3 w-3 mr-1" />
              Filter AI Interactions
            </button>
            <button
              onClick={() => setShowAIChat(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <SparklesIcon className="h-3 w-3 mr-1" />
              AI Assistant
            </button>
            <button
              onClick={exportData}
              disabled={exporting || filteredChats.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {filtersLoading ? (
            <span className="text-primary-600">Loading filtered results...</span>
          ) : (
            <>
              Showing {filteredChats.length} of {chats.length} AI conversations
              {Object.values(filters).some(v => v) && (
                <span className="ml-2 text-primary-600">(filtered)</span>
              )}
              {chats.length === 0 && (
                <span className="ml-2 text-gray-500">
                  • Students haven't used AI tools yet
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* AI Interactions Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filter AI Interactions</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Students</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Tool</label>
              <select
                value={filters.toolUsed}
                onChange={(e) => handleFilterChange('toolUsed', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Tools</option>
                {aiTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
              <select
                value={filters.tagId}
                onChange={(e) => handleFilterChange('tagId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Reflection</label>
              <select
                value={filters.hasReflection}
                onChange={(e) => handleFilterChange('hasReflection', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All</option>
                <option value="true">With Reflection</option>
                <option value="false">Without Reflection</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chat Interactions List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {filteredChats.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleChatClick(chat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header row with student, project, and date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          {chat.users?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">•</div>
                        <div className="text-sm text-gray-500">
                          {chat.projects?.title || 'Unknown Project'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(chat.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {/* AI Tool and Reflection status */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {chat.tool_used}
                      </span>
                      {chat.reflections && chat.reflections.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Has Reflection
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No Reflection
                        </span>
                      )}
                    </div>
                    
                    {/* Prompt */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {chat.prompt}
                      </p>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {chat.chat_tags && chat.chat_tags.length > 0 ? (
                        <>
                          {chat.chat_tags.slice(0, 3).map((chatTag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {chatTag.tags.name}
                            </span>
                          ))}
                          {chat.chat_tags.length > 3 && (
                            <span className="text-xs text-gray-500 py-1">
                              +{chat.chat_tags.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        chat={selectedChat}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* AI Chat Assistant */}
      <InstructorAIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        dashboardData={{
          chats: filteredChats,
          users,
          projects,
          tags,
          stats
        }}
        filters={filters}
      />

      {/* Tag Management */}
      <TagManagement
        isOpen={showTagManagement}
        onClose={() => setShowTagManagement(false)}
        courseId={selectedCourseId}
        courseName={selectedCourse?.courses?.name}
      />
    </div>
  );
} 