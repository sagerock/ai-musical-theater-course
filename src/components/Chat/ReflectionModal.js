import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reflectionApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

export default function ReflectionModal({ chat, onClose, onReflectionUpdated }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingReflection, setExistingReflection] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Load existing reflection if it exists
    if (chat.reflections && chat.reflections.length > 0) {
      const reflection = chat.reflections[0];
      setContent(reflection.content);
      setExistingReflection(reflection);
    }
  }, [chat]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please enter a reflection');
      return;
    }

    try {
      setSaving(true);
      let reflection;

      if (existingReflection) {
        // Update existing reflection
        reflection = await reflectionApi.updateReflection(existingReflection.id, {
          content: content.trim()
        });
      } else {
        // Create new reflection
        reflection = await reflectionApi.createReflection({
          chat_id: chat.id,
          user_id: currentUser.uid,
          content: content.trim()
        });
      }

      onReflectionUpdated(chat.id, reflection);
      toast.success(existingReflection ? 'Reflection updated!' : 'Reflection saved!');
      onClose();
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error('Failed to save reflection');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReflection) return;

    if (window.confirm('Are you sure you want to delete this reflection?')) {
      try {
        setSaving(true);
        await reflectionApi.deleteReflection(existingReflection.id);
        onReflectionUpdated(chat.id, null);
        toast.success('Reflection deleted');
        onClose();
      } catch (error) {
        console.error('Error deleting reflection:', error);
        toast.error('Failed to delete reflection');
      } finally {
        setSaving(false);
      }
    }
  };

  const reflectionPrompts = [
    "How did AI help or hinder your learning process?",
    "What insights did you gain from this interaction?",
    "How might you apply what you learned?",
    "What questions does this raise for you?",
    "How does this relate to your project goals?",
    "What would you do differently next time?"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {existingReflection ? 'Edit Reflection' : 'Add Reflection'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Context */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Your Question:</h4>
                <p className="text-sm text-gray-700 line-clamp-3">{chat.prompt}</p>
              </div>

              {/* Reflection Prompts */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <LightBulbIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-900">Reflection Prompts</h4>
                </div>
                <p className="text-sm text-blue-800 mb-2">Consider these questions as you reflect:</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  {reflectionPrompts.slice(0, 3).map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>

              {/* Reflection Input */}
              <div>
                <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reflection
                </label>
                <textarea
                  id="reflection"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Reflect on how this AI interaction helped or hindered your learning process. What insights did you gain? How might you apply what you learned?"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be honest and thoughtful. This helps track your learning journey and improves your use of AI tools.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : (existingReflection ? 'Update' : 'Save') + ' Reflection'}
            </button>
            
            {existingReflection && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Delete
              </button>
            )}
            
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