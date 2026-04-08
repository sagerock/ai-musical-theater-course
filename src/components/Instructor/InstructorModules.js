import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, BookOpenIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { modulesApi, moduleProgressApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import ModuleCard from '../Modules/ModuleCard';
import CreateModuleModal from '../Modules/CreateModuleModal';
import ModuleProgressGrid from '../Modules/ModuleProgressGrid';
import toast from 'react-hot-toast';

export default function InstructorModules({ selectedCourseId, selectedCourse, currentUser }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showProgressGrid, setShowProgressGrid] = useState(false);

  const loadModules = useCallback(async () => {
    if (!selectedCourseId) {
      setModules([]);
      setLoading(false);
      return;
    }
    try {
      const modulesData = await modulesApi.getModulesByCourse(selectedCourseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    setLoading(true);
    loadModules();
  }, [loadModules]);

  const handleCreateModule = async (formData) => {
    const moduleData = {
      ...formData,
      courseId: selectedCourseId,
      createdBy: currentUser.uid
    };
    await modulesApi.createModule(moduleData);
    toast.success('Module created');
    loadModules();
  };

  const handleUpdateModule = async (formData) => {
    await modulesApi.updateModule(editingModule.id, formData);
    toast.success('Module updated');
    setEditingModule(null);
    loadModules();
  };

  const handleDeleteModule = async (module) => {
    if (!window.confirm(`Delete "${module.title}"? This will also remove all student progress for this module.`)) return;
    try {
      await modulesApi.deleteModule(module.id);
      toast.success('Module deleted');
      loadModules();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  if (!selectedCourseId) {
    return (
      <div className="text-center py-12">
        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Select a course to manage modules.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Course Modules</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create modules with AI-guided conversations. Students complete modules by engaging in a conversation about the material.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {modules.length > 0 && (
            <button
              onClick={() => setShowProgressGrid(!showProgressGrid)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <TableCellsIcon className="h-4 w-4 mr-2" />
              {showProgressGrid ? 'Module List' : 'Student Progress'}
            </button>
          )}
          <button
            onClick={() => { setEditingModule(null); setShowCreateModal(true); }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Module
          </button>
        </div>
      </div>

      {showProgressGrid && modules.length > 0 ? (
        <ModuleProgressGrid courseId={selectedCourseId} modules={modules} />
      ) : modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={null}
              onStartChat={() => {}}
              isInstructor={true}
              onEdit={(m) => { setEditingModule(m); setShowCreateModal(true); }}
              onDelete={handleDeleteModule}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No modules yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Modules let you create AI-guided learning experiences. Each module has a custom AI system prompt
            containing lesson content. Students complete modules by having a conversation with the AI about the material.
          </p>
          <div className="mt-6">
            <button
              onClick={() => { setEditingModule(null); setShowCreateModal(true); }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Your First Module
            </button>
          </div>
        </div>
      )}

      <CreateModuleModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingModule(null); }}
        onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
        existingModule={editingModule}
      />
    </div>
  );
}
