import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AI_TOOLS } from '../../services/aiApi';
import toast from 'react-hot-toast';

const AI_MODEL_OPTIONS = Object.keys(AI_TOOLS);

const CreateModuleModal = ({ isOpen, onClose, onSubmit, existingModule }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 1,
    systemPrompt: '',
    minimumExchanges: 4,
    aiModel: 'GPT-5 Mini'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingModule) {
      setFormData({
        title: existingModule.title || '',
        description: existingModule.description || '',
        order: existingModule.order || 1,
        systemPrompt: existingModule.systemPrompt || '',
        minimumExchanges: existingModule.minimumExchanges || 4,
        aiModel: existingModule.aiModel || 'GPT-5 Mini'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        order: 1,
        systemPrompt: '',
        minimumExchanges: 4,
        aiModel: 'GPT-5 Mini'
      });
    }
  }, [existingModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Module title is required');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      toast.error('System prompt is required — this is the module content the AI will use');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      toast.error('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {existingModule ? 'Edit Module' : 'Create Module'}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="e.g., What Is Generative AI, Really?"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                      Order
                    </label>
                    <input
                      type="number"
                      id="order"
                      min="1"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Short summary shown on the module card"
                  />
                </div>

                <div>
                  <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700">
                    Module Content & AI Instructions *
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the full module content loaded into the AI's system prompt. Include lesson material,
                    discussion points, key concepts, and instructions for how the AI should guide the conversation.
                  </p>
                  <textarea
                    id="systemPrompt"
                    rows={10}
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono text-xs"
                    placeholder="You are guiding a learner through Module 1: What Is Generative AI, Really?..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {formData.systemPrompt.length.toLocaleString()} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700">
                      AI Model
                    </label>
                    <select
                      id="aiModel"
                      value={formData.aiModel}
                      onChange={(e) => setFormData(prev => ({ ...prev, aiModel: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      {AI_MODEL_OPTIONS.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="minimumExchanges" className="block text-sm font-medium text-gray-700">
                      Minimum Exchanges for Completion
                    </label>
                    <input
                      type="number"
                      id="minimumExchanges"
                      min="1"
                      max="20"
                      value={formData.minimumExchanges}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimumExchanges: parseInt(e.target.value) || 4 }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Each back-and-forth counts as 1 exchange
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : (existingModule ? 'Update Module' : 'Create Module')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateModuleModal;
