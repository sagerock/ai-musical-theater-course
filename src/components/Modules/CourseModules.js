import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, BookOpenIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { modulesApi, moduleProgressApi, courseApi } from '../../services/firebaseApi';
import { hasTeachingPermissions } from '../../utils/roleUtils';
import ModuleCard from './ModuleCard';
import CreateModuleModal from './CreateModuleModal';
import ModuleProgressGrid from './ModuleProgressGrid';
import toast from 'react-hot-toast';

const CourseModules = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [course, setCourse] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showProgressGrid, setShowProgressGrid] = useState(false);

  const isInstructor = membership && hasTeachingPermissions(membership.role);

  const loadData = useCallback(async () => {
    if (!currentUser || !courseId) return;
    try {
      const [courseData, membershipData, modulesData] = await Promise.all([
        courseApi.getCourseById(courseId),
        courseApi.getUserCourseMembership(currentUser.id, courseId),
        modulesApi.getModulesByCourse(courseId)
      ]);
      setCourse(courseData);
      setMembership(membershipData);
      setModules(modulesData);

      if (membershipData && !hasTeachingPermissions(membershipData.role)) {
        const progressData = await moduleProgressApi.getStudentModuleProgress(currentUser.id, courseId);
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [currentUser, courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateModule = async (formData) => {
    const moduleData = {
      ...formData,
      courseId,
      createdBy: currentUser.id
    };
    await modulesApi.createModule(moduleData);
    toast.success('Module created');
    loadData();
  };

  const handleUpdateModule = async (formData) => {
    await modulesApi.updateModule(editingModule.id, formData);
    toast.success('Module updated');
    setEditingModule(null);
    loadData();
  };

  const handleDeleteModule = async (module) => {
    if (!window.confirm(`Delete "${module.title}"? This will also remove all student progress for this module.`)) return;
    try {
      await modulesApi.deleteModule(module.id);
      toast.success('Module deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleStartChat = (module) => {
    navigate(`/course/${courseId}/modules/${module.id}/chat`);
  };

  const filteredModules = modules.filter(m => {
    if (filter === 'all') return true;
    const p = progress[m.id];
    if (filter === 'in_progress') return p && !p.completed;
    if (filter === 'completed') return p && p.completed;
    if (filter === 'not_started') return !p;
    return true;
  });

  const completedCount = modules.filter(m => progress[m.id]?.completed).length;
  const inProgressCount = modules.filter(m => progress[m.id] && !progress[m.id].completed).length;

  if (loading) {
    return (
      <div className="bg-[#faf7f2] min-h-screen overflow-x-hidden p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (!course || !membership) {
    return (
      <div className="bg-[#faf7f2] min-h-screen overflow-x-hidden p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Course not found or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf7f2] min-h-screen overflow-x-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          {!isInstructor && modules.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {completedCount} of {modules.length} completed
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isInstructor && (
            <>
              <button
                onClick={() => setShowProgressGrid(!showProgressGrid)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <TableCellsIcon className="h-4 w-4 mr-2" />
                {showProgressGrid ? 'Module List' : 'Progress Grid'}
              </button>
              <button
                onClick={() => { setEditingModule(null); setShowCreateModal(true); }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Module
              </button>
            </>
          )}
        </div>
      </div>

      {isInstructor && showProgressGrid ? (
        <ModuleProgressGrid courseId={courseId} modules={modules} />
      ) : (
        <>
          {!isInstructor && modules.length > 1 && (
            <div className="mb-6 flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {[
                { key: 'all', label: `All (${modules.length})` },
                { key: 'in_progress', label: `In Progress (${inProgressCount})` },
                { key: 'completed', label: `Completed (${completedCount})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Progress bar for students */}
          {!isInstructor && modules.length > 0 && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / modules.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map(module => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  progress={progress[module.id]}
                  onStartChat={handleStartChat}
                  isInstructor={isInstructor}
                  onEdit={(m) => { setEditingModule(m); setShowCreateModal(true); }}
                  onDelete={handleDeleteModule}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {modules.length === 0 ? 'No modules yet' : 'No modules match this filter'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                {modules.length === 0 && isInstructor
                  ? 'Create your first module to start building your course.'
                  : modules.length === 0
                    ? 'Your instructor hasn\'t added any modules yet. Check back soon!'
                    : 'Try a different filter.'}
              </p>
              {modules.length === 0 && isInstructor && (
                <div className="mt-6">
                  <button
                    onClick={() => { setEditingModule(null); setShowCreateModal(true); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create Module
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CreateModuleModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingModule(null); }}
        onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
        existingModule={editingModule}
      />
    </div>
  );
};

export default CourseModules;
