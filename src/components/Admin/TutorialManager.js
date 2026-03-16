import React, { useState, useEffect, useCallback } from 'react';
import { tutorialApi } from '../../services/firebaseApi';
import staticTutorials from '../../data/tutorials';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  description: '',
  category: '',
  audience: ['student'],
  videoUrl: '',
  transcript: '',
  duration: '',
  published: true,
};

export default function TutorialManager() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const loadTutorials = useCallback(async () => {
    try {
      const data = await tutorialApi.getAllTutorials();
      setTutorials(data);
    } catch (err) {
      console.error('Error loading tutorials:', err);
      toast.error('Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTutorials();
  }, [loadTutorials]);

  // Derived categories for autocomplete
  const existingCategories = [...new Set(tutorials.map(t => t.category).filter(Boolean))];

  const handleTitleChange = (value) => {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: slugManuallyEdited ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    setForm(prev => ({ ...prev, slug: slugify(value) }));
  };

  const handleAudienceToggle = (role) => {
    setForm(prev => ({
      ...prev,
      audience: prev.audience.includes(role)
        ? prev.audience.filter(a => a !== role)
        : [...prev.audience, role],
    }));
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      order: tutorials.length + 1,
    });
    setSlugManuallyEdited(false);
    setShowForm(true);
  };

  const openEditForm = (tutorial) => {
    setEditingId(tutorial.id);
    setForm({
      title: tutorial.title || '',
      slug: tutorial.slug || '',
      description: tutorial.description || '',
      category: tutorial.category || '',
      audience: tutorial.audience || ['student'],
      videoUrl: tutorial.videoUrl || '',
      transcript: tutorial.transcript || '',
      duration: tutorial.duration || '',
      published: tutorial.published ?? true,
    });
    setSlugManuallyEdited(true);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        videoUrl: form.videoUrl.trim(),
        transcript: form.transcript.trim(),
        duration: form.duration.trim(),
      };

      if (editingId) {
        await tutorialApi.updateTutorial(editingId, data);
        toast.success('Tutorial updated');
      } else {
        data.order = tutorials.length + 1;
        await tutorialApi.createTutorial(data);
        toast.success('Tutorial created');
      }

      setShowForm(false);
      await loadTutorials();
    } catch (err) {
      toast.error(err.message || 'Failed to save tutorial');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tutorialApi.deleteTutorial(id);
      toast.success('Tutorial deleted');
      setShowDeleteConfirm(null);
      await loadTutorials();
    } catch (err) {
      toast.error('Failed to delete tutorial');
    }
  };

  const handleTogglePublished = async (tutorial) => {
    try {
      await tutorialApi.updateTutorial(tutorial.id, { published: !tutorial.published });
      setTutorials(prev =>
        prev.map(t => t.id === tutorial.id ? { ...t, published: !t.published } : t)
      );
      toast.success(tutorial.published ? 'Tutorial unpublished' : 'Tutorial published');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const items = [...tutorials];
    const prevOrder = items[index - 1].order;
    const currOrder = items[index].order;

    await tutorialApi.reorderTutorials([
      { id: items[index].id, order: prevOrder },
      { id: items[index - 1].id, order: currOrder },
    ]);
    await loadTutorials();
  };

  const handleMoveDown = async (index) => {
    if (index === tutorials.length - 1) return;
    const items = [...tutorials];
    const nextOrder = items[index + 1].order;
    const currOrder = items[index].order;

    await tutorialApi.reorderTutorials([
      { id: items[index].id, order: nextOrder },
      { id: items[index + 1].id, order: currOrder },
    ]);
    await loadTutorials();
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will populate Firestore with the 12 default tutorials. Continue?')) return;
    try {
      await tutorialApi.seedFromStaticData(staticTutorials);
      toast.success('Seeded 12 tutorials from default data');
      await loadTutorials();
    } catch (err) {
      toast.error(err.message || 'Seed failed');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tutorial Manager</h2>
          <p className="text-sm text-gray-500 mt-1">
            {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} &middot;{' '}
            {tutorials.filter(t => t.published).length} published
          </p>
        </div>
        <div className="flex gap-2">
          {tutorials.length === 0 && (
            <button
              onClick={handleSeedData}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Seed Default Tutorials
            </button>
          )}
          <button
            onClick={openCreateForm}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Tutorial
          </button>
        </div>
      </div>

      {/* Tutorial List */}
      {tutorials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <PlayCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No tutorials yet</p>
          <button
            onClick={handleSeedData}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Seed with default tutorials
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutorial</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-36">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Video</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tutorials.map((tutorial, index) => (
                <tr key={tutorial.id} className="hover:bg-gray-50">
                  {/* Order / reorder */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 w-5 text-center">{tutorial.order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUpIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === tutorials.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDownIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  {/* Title + description */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{tutorial.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-md">{tutorial.description}</div>
                    <div className="flex gap-1 mt-1">
                      {(tutorial.audience || []).map(a => (
                        <span
                          key={a}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            a === 'instructor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{tutorial.category}</span>
                  </td>
                  {/* Video */}
                  <td className="px-4 py-3">
                    {tutorial.videoUrl ? (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <PlayCircleIcon className="h-4 w-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  {/* Published toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleTogglePublished(tutorial)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tutorial.published ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tutorial.published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(tutorial)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(tutorial)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
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
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Tutorial' : 'New Tutorial'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Creating Your First Project"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug * <span className="text-gray-400 font-normal">(URL path)</span>
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-400 mr-1">/tutorials/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="creating-your-first-project"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="A brief description of this tutorial"
                />
              </div>

              {/* Category + Duration row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    list="tutorial-categories"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Getting Started"
                  />
                  <datalist id="tutorial-categories">
                    {existingCategories.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2:30"
                  />
                </div>
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                <div className="flex gap-4">
                  {[
                    { key: 'student', label: 'Students' },
                    { key: 'instructor', label: 'Instructors' },
                    { key: 'admin', label: 'Admins' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.audience.includes(key)}
                        onChange={() => handleAudienceToggle(key)}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Embed URL
                </label>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use YouTube embed URL format: youtube.com/embed/... or Loom: loom.com/embed/...
                </p>
              </div>

              {/* Transcript */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
                <textarea
                  value={form.transcript}
                  onChange={e => setForm(prev => ({ ...prev, transcript: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste the video transcript here..."
                />
              </div>

              {/* Published */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                  id="published-checkbox"
                />
                <label htmlFor="published-checkbox" className="text-sm text-gray-700">
                  Published (visible on public Tutorials page)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Tutorial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Tutorial</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{showDeleteConfirm.title}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
