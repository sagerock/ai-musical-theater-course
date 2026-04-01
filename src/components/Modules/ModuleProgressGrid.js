import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon, MinusIcon } from '@heroicons/react/24/outline';
import { moduleProgressApi, courseApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';

const ModuleProgressGrid = ({ courseId, modules }) => {
  const [students, setStudents] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [members, progress] = await Promise.all([
          courseApi.getCourseMembers(courseId),
          moduleProgressApi.getCourseModuleProgress(courseId)
        ]);

        // Filter to approved students only
        const studentMembers = members.filter(m =>
          m.status === 'approved' && ['student', 'student_assistant'].includes(m.role)
        );
        setStudents(studentMembers);
        setProgressData(progress);
      } catch (error) {
        console.error('Error loading progress grid:', error);
        toast.error('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No students enrolled in this course yet.</p>
      </div>
    );
  }

  // Build a lookup: { `${userId}_${moduleId}`: progressDoc }
  const progressMap = {};
  progressData.forEach(p => {
    const key = `${p.userId}_${p.moduleId}`;
    progressMap[key] = p;
  });

  // Calculate per-module completion stats
  const moduleStats = modules.map(m => {
    const completed = students.filter(s => progressMap[`${s.userId}_${m.id}`]?.completed).length;
    const started = students.filter(s => progressMap[`${s.userId}_${m.id}`] && !progressMap[`${s.userId}_${m.id}`].completed).length;
    return { moduleId: m.id, completed, started, total: students.length };
  });

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {modules.map((m, i) => {
          const stats = moduleStats[i];
          const pct = students.length > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          return (
            <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary-600">Module {m.order}</span>
                <span className="text-xs font-medium text-gray-500">{pct}%</span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate mb-2">{m.title}</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completed} completed, {stats.started} in progress
              </p>
            </div>
          );
        })}
      </div>

      {/* Grid table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                Student
              </th>
              {modules.map(m => (
                <th key={m.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  M{m.order}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => (
              <tr key={student.userId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sticky left-0 bg-white">
                  {student.displayName || student.email}
                </td>
                {modules.map(m => {
                  const p = progressMap[`${student.userId}_${m.id}`];
                  return (
                    <td key={m.id} className="px-4 py-3 text-center">
                      {p?.completed ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" title="Completed" />
                      ) : p ? (
                        <span className="inline-flex items-center" title={`${p.exchangeCount} exchanges`}>
                          <ClockIcon className="h-5 w-5 text-yellow-500 mx-auto" />
                        </span>
                      ) : (
                        <MinusIcon className="h-5 w-5 text-gray-300 mx-auto" title="Not started" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModuleProgressGrid;
