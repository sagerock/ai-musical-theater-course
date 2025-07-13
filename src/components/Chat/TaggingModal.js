import React, { useState, useEffect } from 'react';
import { tagApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  TagIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function TaggingModal({ chat, availableTags, onClose, onTagsUpdated, courseId }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize with existing tags
    if (chat.chat_tags) {
      const existingTagIds = chat.chat_tags.map(ct => ct.tags.id);
      setSelectedTags(existingTagIds);
    }
  }, [chat]);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setCreatingTag(true);
      const newTag = await tagApi.createTag({
        name: newTagName.trim(),
        description: `User-created tag: ${newTagName.trim()}`
      }, courseId);

      // Add to available tags
      availableTags.push(newTag);
      
      // Select the new tag
      setSelectedTags(prev => [...prev, newTag.id]);
      
      setNewTagName('');
      toast.success('Tag created successfully!');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Get current tag IDs
      const currentTagIds = chat.chat_tags ? chat.chat_tags.map(ct => ct.tags.id) : [];
      
      // Determine which tags to add and remove
      const tagsToAdd = selectedTags.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !selectedTags.includes(id));

      // Remove old tags
      if (tagsToRemove.length > 0) {
        await tagApi.removeTagsFromChat(chat.id, tagsToRemove);
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        await tagApi.addTagsToChat(chat.id, tagsToAdd);
      }

      // Update local state
      const updatedTags = availableTags.filter(tag => selectedTags.includes(tag.id));
      onTagsUpdated(chat.id, updatedTags);

      toast.success('Tags updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error('Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TagIcon className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Add Tags</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Tags help categorize and organize your AI interactions for easier review and analysis.
            </p>

            {/* Available Tags */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Select Tags</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`flex items-center justify-between p-2 text-sm rounded-md border transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-primary-50 border-primary-200 text-primary-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{tag.name}</span>
                      {selectedTags.includes(tag.id) && (
                        <CheckIcon className="h-4 w-4 text-primary-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create New Tag */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Tag</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateNewTag();
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateNewTag}
                    disabled={!newTagName.trim() || creatingTag}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {creatingTag ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Selected Tags Summary */}
              {selectedTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Tags ({selectedTags.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Tags'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 