import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { announcementApi, courseApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import CreateAnnouncement from './CreateAnnouncement';
import AnnouncementCard from './AnnouncementCard';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ExclamationCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function CourseAnnouncements() {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courseMembership, setCourseMembership] = useState(null);
  const [course, setCourse] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'announcements', 'discussions'

  useEffect(() => {
    if (courseId && currentUser) {
      loadCourseData();
      loadAnnouncements();
    }
  }, [courseId, currentUser]);

  const loadCourseData = async () => {
    try {
      // Get course membership to determine user role
      const membership = await courseApi.getUserCourseMembership(currentUser.id, courseId);
      setCourseMembership(membership);

      // Get course info
      const courseData = await courseApi.getCourse(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course data:', error);
      toast.error('Failed to load course information');
    }
  };

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementApi.getAnnouncements(courseId);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementCreated = (newAnnouncement) => {
    setAnnouncements([newAnnouncement, ...announcements]);
    setShowCreateForm(false);
    const isDiscussion = newAnnouncement.type === 'discussion';
    toast.success(isDiscussion ? 'Discussion started!' : 'Announcement posted!');
  };

  const handleAnnouncementDeleted = (announcementId) => {
    const deleted = announcements.find(a => a.id === announcementId);
    setAnnouncements(announcements.filter(a => a.id !== announcementId));
    toast.success(deleted?.type === 'discussion' ? 'Discussion deleted' : 'Announcement deleted');
  };

  const handleAnnouncementUpdated = (announcementId, updates) => {
    setAnnouncements(announcements.map(a =>
      a.id === announcementId ? { ...a, ...updates } : a
    ));
  };

  const canCreateAnnouncements = courseMembership && hasTeachingPermissions(courseMembership.role);
  const canCreateDiscussions = !!courseMembership; // All course members can create discussions

  // Filter announcements based on selected filter
  const filteredAnnouncements = announcements.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'announcements') return item.type === 'announcement' || !item.type;
    if (filter === 'discussions') return item.type === 'discussion';
    return true;
  });

  // Count items for filter tabs
  const announcementCount = announcements.filter(a => a.type === 'announcement' || !a.type).length;
  const discussionCount = announcements.filter(a => a.type === 'discussion').length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-primary-600" />
              Discussions
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {course?.title || 'Loading...'} • {announcements.length} post{announcements.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreateDiscussions && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {canCreateAnnouncements ? 'New Post' : 'Start Discussion'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({announcements.length})
        </button>
        <button
          onClick={() => setFilter('announcements')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'announcements'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Announcements ({announcementCount})
        </button>
        <button
          onClick={() => setFilter('discussions')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'discussions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Discussions ({discussionCount})
        </button>
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreateAnnouncement
            courseId={courseId}
            currentUser={currentUser}
            courseMembership={courseMembership}
            onCancel={() => setShowCreateForm(false)}
            onSuccess={handleAnnouncementCreated}
          />
        </div>
      )}

      {/* Discussions List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {filter === 'all' && 'No discussions yet'}
              {filter === 'announcements' && 'No announcements yet'}
              {filter === 'discussions' && 'No student discussions yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' && (canCreateDiscussions
                ? "Start a discussion or check back later for announcements."
                : "Check back later for course discussions.")}
              {filter === 'announcements' && "Check back later for announcements from your instructor."}
              {filter === 'discussions' && (canCreateDiscussions
                ? "Be the first to start a discussion!"
                : "No student discussions have been started yet.")}
            </p>
            {canCreateDiscussions && filter !== 'announcements' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Start Discussion
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              currentUser={currentUser}
              courseMembership={courseMembership}
              onDelete={handleAnnouncementDeleted}
              onUpdate={handleAnnouncementUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}