import React from 'react';
import { AcademicCapIcon, ArrowDownTrayIcon, TagIcon } from '@heroicons/react/24/outline';

export default function CourseSelector({ 
  courses, 
  selectedCourseId, 
  onCourseChange, 
  selectedCourse, 
  loading,
  exporting,
  onExportData,
  onManageTags 
}) {
  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 animate-pulse">
        <div className="h-6 bg-blue-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <>
      {/* Course Selection */}
      {courses.length > 1 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Viewing Course:</label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => onCourseChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {courses.map((courseMembership) => (
                <option key={courseMembership.courses.id} value={courseMembership.courses.id}>
                  {courseMembership.courses.title} ({courseMembership.courses.course_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Current Course Info */}
      {selectedCourse && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  {selectedCourse.courses.title}
                </h3>
                <p className="text-xs text-blue-700">
                  {selectedCourse.courses.course_code} • {selectedCourse.courses.semester} {selectedCourse.courses.year}
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onExportData}
                disabled={exporting}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </button>
              <button
                onClick={onManageTags}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                Manage Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}