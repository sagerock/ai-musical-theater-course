import React from 'react';
import { CheckCircleIcon, PlayCircleIcon, ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const ModuleCard = ({ module, progress, onStartChat, isInstructor, onEdit, onDelete }) => {
  const getStatus = () => {
    if (!progress) return 'not_started';
    if (progress.completed) return 'completed';
    return 'in_progress';
  };

  const status = getStatus();

  const statusConfig = {
    not_started: {
      label: 'Not Started',
      icon: ClockIcon,
      badgeClass: 'bg-gray-100 text-gray-600',
      borderClass: 'border-gray-200',
      ctaLabel: 'Start Module',
      ctaClass: 'bg-primary-600 hover:bg-primary-700 text-white'
    },
    in_progress: {
      label: `In Progress (${progress?.exchangeCount || 0}/${module.minimumExchanges})`,
      icon: PlayCircleIcon,
      badgeClass: 'bg-yellow-100 text-yellow-700',
      borderClass: 'border-yellow-300',
      ctaLabel: 'Continue',
      ctaClass: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    },
    completed: {
      label: 'Completed',
      icon: CheckCircleSolid,
      badgeClass: 'bg-green-100 text-green-700',
      borderClass: 'border-green-300',
      ctaLabel: 'Review',
      ctaClass: 'bg-green-600 hover:bg-green-700 text-white'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${config.borderClass} hover:shadow-md transition-shadow`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
            Module {module.order}
          </span>
          <div className="flex items-center space-x-1">
            {isInstructor && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(module); }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Edit module"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(module); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                  title="Delete module"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{module.description}</p>

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeClass}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {config.label}
          </span>

          <button
            onClick={() => onStartChat(module)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${config.ctaClass}`}
          >
            {config.ctaLabel}
          </button>
        </div>

        {status === 'completed' && progress?.completedAt && (
          <p className="mt-3 text-xs text-gray-500">
            Completed {new Date(progress.completedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;
