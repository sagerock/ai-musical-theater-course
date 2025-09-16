import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { announcementApi, courseApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import CreateAnnouncement from './CreateAnnouncement';
import AnnouncementCard from './AnnouncementCard';
import toast from 'react-hot-toast';
import {
  MegaphoneIcon,
  PlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function CourseAnnouncements() {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courseMembership, setCourseMembership] = useState(null);
  const [course, setCourse] = useState(null);

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
    toast.success('Announcement posted successfully!');
  };

  const handleAnnouncementDeleted = (announcementId) => {
    setAnnouncements(announcements.filter(a => a.id !== announcementId));
    toast.success('Announcement deleted');
  };

  const handleAnnouncementUpdated = (announcementId, updates) => {
    setAnnouncements(announcements.map(a =>
      a.id === announcementId ? { ...a, ...updates } : a
    ));
  };

  const canCreateAnnouncements = courseMembership && hasTeachingPermissions(courseMembership.role);

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MegaphoneIcon className="h-8 w-8 mr-3 text-primary-600" />
              Course Announcements
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {course?.title || 'Loading...'} • {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canCreateAnnouncements && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Announcement
            </button>
          )}
        </div>
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

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No announcements yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canCreateAnnouncements
                ? "Get started by creating your first announcement."
                : "Check back later for course announcements from your instructor."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
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