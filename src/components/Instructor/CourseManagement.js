import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tagApi, courseApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import TaggedChatsModal from './TaggedChatsModal';
import {
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  SwatchIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function CourseManagement({ selectedCourseId, selectedCourse, currentUser, onCourseUpdated }) {
  const [tags, setTags] = useState([]);
  const [globalTags, setGlobalTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [editTag, setEditTag] = useState({ name: '', color: '#3B82F6' });
  
  // Course editing state
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    name: '',
    description: '',
    course_code: '',
    semester: '',
    year: '',
    school: '',
    instructor: '',
    instructor_email: ''
  });
  const [courseSaving, setCourseSaving] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  const { userRole } = useAuth();

  const semesterOptions = [
    { value: '', label: 'Select Semester' },
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Fall', label: 'Fall' },
    { value: 'Winter', label: 'Winter' },
    { value: 'Intersession', label: 'Intersession' }
  ];

  const tagColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ];

  useEffect(() => {
    if (selectedCourseId) {
      loadTags();
    }
  }, [selectedCourseId]);

  // Load course data when selectedCourse changes
  useEffect(() => {
    if (selectedCourse?.courses) {
      setCourseData({
        name: selectedCourse.courses.title || '',  // Map title to name for UI consistency
        description: selectedCourse.courses.description || '',
        course_code: selectedCourse.courses.course_code || '',
        semester: selectedCourse.courses.semester || '',
        year: selectedCourse.courses.year || '',
        school: selectedCourse.courses.school || '',
        instructor: selectedCourse.courses.instructor || '',
        instructor_email: selectedCourse.courses.instructor_email || ''
      });
    }
  }, [selectedCourse]);

  const loadTags = async () => {
    try {
      setLoading(true);
      // Load both course-specific and global tags WITH usage counts
      const [courseTagsData, globalTagsData] = await Promise.all([
        tagApi.getCourseTagsWithUsage(selectedCourseId),
        tagApi.getGlobalTagsWithUsage(selectedCourseId)
      ]);
      setTags(courseTagsData);
      setGlobalTags(globalTagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const tagData = {
        name: newTag.name.trim(),
        color: newTag.color,
        course_id: selectedCourseId
      };

      const createdTag = await tagApi.createTag(tagData, null, userRole);
      setTags(prev => [...prev, createdTag]);
      setNewTag({ name: '', color: '#3B82F6' });
      setIsCreating(false);
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const handleUpdateTag = async () => {
    if (!editTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const updatedTag = await tagApi.updateTag(editingTag.id, {
        name: editTag.name.trim(),
        color: editTag.color
      });

      setTags(prev => prev.map(tag => 
        tag.id === editingTag.id ? updatedTag : tag
      ));
      setEditingTag(null);
      setEditTag({ name: '', color: '#3B82F6' });
      toast.success('Tag updated successfully');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return;
    }

    try {
      await tagApi.deleteTag(tagId);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setEditTag({ name: tag.name, color: tag.color });
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditTag({ name: '', color: '#3B82F6' });
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTag({ name: '', color: '#3B82F6' });
  };

  const handleCourseInputChange = (field, value) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCourse = async () => {
    try {
      setCourseSaving(true);
      
      // Validate required fields
      if (!courseData.name.trim()) {
        toast.error('Course name is required');
        return;
      }

      // Update the course (excluding course_code since it's not editable)
      const updateData = {
        title: courseData.name.trim(),  // Map name to title (actual database field)
        description: courseData.description.trim(),
        semester: courseData.semester.trim(),
        year: courseData.year ? parseInt(courseData.year) : null,
        school: courseData.school.trim(),
        instructor: courseData.instructor.trim(),
        instructor_email: courseData.instructor_email.trim()
      };
      
      await courseApi.updateCourse(selectedCourseId, updateData);

      setIsEditingCourse(false);
      toast.success('Course updated successfully');
      
      // Refresh course data in parent component
      if (onCourseUpdated) {
        await onCourseUpdated();
      }
      
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setCourseSaving(false);
    }
  };

  const handleCancelCourseEdit = () => {
    // Reset form data to original values
    if (selectedCourse?.courses) {
      setCourseData({
        name: selectedCourse.courses.title || '',  // Map title to name for UI consistency
        description: selectedCourse.courses.description || '',
        course_code: selectedCourse.courses.course_code || '',
        semester: selectedCourse.courses.semester || '',
        year: selectedCourse.courses.year || '',
        school: selectedCourse.courses.school || '',
        instructor: selectedCourse.courses.instructor || '',
        instructor_email: selectedCourse.courses.instructor_email || ''
      });
    }
    setIsEditingCourse(false);
  };

  const handleTagUsageClick = (tag) => {
    if (tag.usage_count > 0) {
      setSelectedTag(tag);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTag(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Course Management</h2>
          <p className="text-sm text-gray-600">
            Manage tags and course settings for {selectedCourse?.courses?.name}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Tag
        </button>
      </div>

      {/* Course Information */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Course Information</h3>
          {!isEditingCourse ? (
            <button
              onClick={() => setIsEditingCourse(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Course
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancelCourseEdit}
                disabled={courseSaving}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSaveCourse}
                disabled={courseSaving}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {courseSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {isEditingCourse ? (
          // Edit mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={courseData.name}
                onChange={(e) => handleCourseInputChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter course name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-700">
                {courseData.course_code || 'Not specified'}
              </div>
              <p className="mt-1 text-xs text-gray-500">Course code cannot be modified</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={courseData.school}
                  onChange={(e) => handleCourseInputChange('school', e.target.value)}
                  className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter school name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={courseData.instructor}
                  onChange={(e) => handleCourseInputChange('instructor', e.target.value)}
                  className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter instructor name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={courseData.instructor_email}
                  onChange={(e) => handleCourseInputChange('instructor_email', e.target.value)}
                  className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter instructor email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select
                value={courseData.semester}
                onChange={(e) => handleCourseInputChange('semester', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {semesterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={courseData.year}
                onChange={(e) => handleCourseInputChange('year', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter year (e.g., 2024)"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={courseData.description}
                onChange={(e) => handleCourseInputChange('description', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter course description"
              />
            </div>
          </div>
        ) : (
          // View mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse?.courses?.title || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Code</label>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse?.courses?.course_code || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse?.courses?.school || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor</label>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse?.courses?.instructor || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor Email</label>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse?.courses?.instructor_email || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedCourse?.courses?.semester} {selectedCourse?.courses?.year}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900">
                {selectedCourse?.courses?.description || 'No description provided'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tag Management */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tag Management</h3>
        
        {/* Create Tag Form */}
        {isCreating && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Create New Tag</h4>
              <button
                onClick={cancelCreating}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tag name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: newTag.color }}
                  />
                  <select
                    value={newTag.color}
                    onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tagColors.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={cancelCreating}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Tag
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="space-y-2">
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tags yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create tags to help students categorize their AI interactions.
              </p>
            </div>
          ) : (
            tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {editingTag?.id === tag.id ? (
                  // Edit mode
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: editTag.color }}
                      />
                      <select
                        value={editTag.color}
                        onChange={(e) => setEditTag(prev => ({ ...prev, color: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        {tagColors.map(color => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editTag.name}
                      onChange={(e) => setEditTag(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleUpdateTag}
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                      <button
                        onClick={() => handleTagUsageClick(tag)}
                        className={`text-xs ${
                          tag.usage_count > 0 
                            ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' 
                            : 'text-gray-500 cursor-default'
                        } transition-colors`}
                        disabled={!tag.usage_count}
                      >
                        {tag.usage_count || 0} uses
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(tag)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Global Default Tags */}
      {globalTags.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-center mb-4">
            <TagIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-blue-900">Default Tags (Available in All Courses)</h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            These tags are automatically available to students and instructors across all courses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {globalTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center space-x-3 p-3 bg-white border border-blue-200 rounded-lg shadow-sm"
              >
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                  <button
                    onClick={() => handleTagUsageClick(tag)}
                    className={`text-xs ml-2 ${
                      tag.usage_count > 0 
                        ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' 
                        : 'text-gray-500 cursor-default'
                    } transition-colors`}
                    disabled={!tag.usage_count}
                  >
                    {tag.usage_count || 0} uses in this course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tag Usage Statistics */}
      {tags.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tag Usage Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
                  style={{ backgroundColor: tag.color }}
                >
                  <SwatchIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                  <button
                    onClick={() => handleTagUsageClick(tag)}
                    className={`text-xs ${
                      tag.usage_count > 0 
                        ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' 
                        : 'text-gray-500 cursor-default'
                    } transition-colors`}
                    disabled={!tag.usage_count}
                  >
                    {tag.usage_count || 0} interactions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tagged Chats Modal */}
      <TaggedChatsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        tagName={selectedTag?.name}
        tagId={selectedTag?.id}
        courseId={selectedCourseId}
        tagColor={selectedTag?.color}
      />
    </div>
  );
}