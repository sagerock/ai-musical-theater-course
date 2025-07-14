import React, { useState, useEffect } from 'react';
import { tagApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function TagManagement({ isOpen, onClose, courseId, courseName }) {
  const [courseTags, setCourseTags] = useState([]);
  const [globalTags, setGlobalTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen && courseId) {
      loadTags();
    }
  }, [isOpen, courseId]);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      // Load course-specific tags and global tags separately
      const [courseTagsData, globalTagsData] = await Promise.all([
        tagApi.getCourseTags(courseId),
        tagApi.getAllTags() // This will return only global tags (courseId=null)
      ]);
      
      setCourseTags(courseTagsData || []);
      setGlobalTags(globalTagsData || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const newTag = await tagApi.createTag({
        name: formData.name.trim(),
        description: formData.description.trim() || `Course-specific tag: ${formData.name.trim()}`
      }, courseId, 'instructor'); // Tag management is only accessible to instructors

      setCourseTags([...courseTags, newTag]);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      toast.success('Tag created successfully!');
    } catch (error) {
      console.error('Error creating tag:', error);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('A tag with this name already exists in this course');
      } else {
        toast.error('Failed to create tag');
      }
    }
  };

  const handleEditTag = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const updatedTag = await tagApi.updateTag(editingTag.id, {
        name: formData.name.trim(),
        description: formData.description.trim()
      }, courseId);

      setCourseTags(courseTags.map(tag => 
        tag.id === editingTag.id ? updatedTag : tag
      ));
      setEditingTag(null);
      setFormData({ name: '', description: '' });
      toast.success('Tag updated successfully!');
    } catch (error) {
      console.error('Error updating tag:', error);
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        toast.error('A tag with this name already exists in this course');
      } else {
        toast.error('Failed to update tag');
      }
    }
  };

  const handleDeleteTag = async (tag) => {
    try {
      await tagApi.deleteTag(tag.id, courseId);
      setCourseTags(courseTags.filter(t => t.id !== tag.id));
      setDeletingTag(null);
      toast.success('Tag deleted successfully!');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const startEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setFormData({ name: '', description: '' });
  };

  const startCreate = () => {
    setShowCreateForm(true);
    setEditingTag(null);
    setFormData({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TagIcon className="h-6 w-6 text-primary-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Tag Management
              </h3>
              <p className="text-sm text-gray-500">
                Manage tags for {courseName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Course-specific Tags */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900">
                  Course Tags ({courseTags.length})
                </h4>
                <button
                  onClick={startCreate}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Add Tag
                </button>
              </div>

              {/* Create/Edit Form */}
              {(showCreateForm || editingTag) && (
                <form onSubmit={editingTag ? handleEditTag : handleCreateTag} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tag Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter tag name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <CheckIcon className="h-3 w-3 mr-1" />
                      {editingTag ? 'Update Tag' : 'Create Tag'}
                    </button>
                    <button
                      type="button"
                      onClick={editingTag ? cancelEdit : () => setShowCreateForm(false)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Course Tags List */}
              {courseTags.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {courseTags.map((tag) => (
                        <tr key={tag.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {tag.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {tag.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tag.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => startEdit(tag)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Edit tag"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingTag(tag)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete tag"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <TagIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No course tags yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first course-specific tag to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Global Tags (Read-only) */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Global Tags ({globalTags.length})
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Available to all courses, read-only)
                </span>
              </h4>
              
              {globalTags.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {globalTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No global tags available.</p>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingTag && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete Tag
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete the tag "{deletingTag.name}"? This action cannot be undone and will remove the tag from all associated conversations.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => handleDeleteTag(deletingTag)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingTag(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}