import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { courseApi } from '../../services/firebaseApi';
import { formatCurrency, formatNumber } from '../../utils/costCalculator';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CpuChipIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function UsageAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedCourseId]);

  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const allCourses = await courseApi.getAllCourses();
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      
      if (showCustomDate && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day
      } else {
        endDate = new Date();
        startDate = new Date(endDate.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
      }

      console.log('📊 Loading analytics for date range:', startDate, 'to', endDate, 'course:', selectedCourseId);
      const data = await analyticsApi.getPlatformUsageAnalytics(startDate, endDate, selectedCourseId);
      setAnalyticsData(data);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load usage analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRange(value);
    if (value !== 'custom') {
      setShowCustomDate(false);
    } else {
      setShowCustomDate(true);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      loadAnalytics();
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  const exportToCSV = () => {
    if (!analyticsData) return;
    
    try {
      const csvData = analyticsData.rawData.map(record => {
        const course = courses.find(c => c.id === record.courseId);
        return {
          Date: record.date.toISOString().split('T')[0],
          Model: record.model,
          'Input Tokens': record.inputTokens,
          'Output Tokens': record.outputTokens,
          'Total Tokens': record.inputTokens + record.outputTokens,
          Searches: record.searches,
          'User ID': record.userId,
          'Course ID': record.courseId,
          'Course Name': course?.title || 'Unknown Course',
          'Course Code': course?.course_code || 'N/A'
        };
      });

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Include course name in filename if filtering by specific course
      const coursePrefix = selectedCourseId === 'all' 
        ? 'platform-usage' 
        : `course-usage-${courses.find(c => c.id === selectedCourseId)?.course_code || 'unknown'}`;
      a.download = `${coursePrefix}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Usage data exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Unable to load platform usage analytics.
        </p>
      </div>
    );
  }

  const { summary, breakdown } = analyticsData;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Usage Analytics</h1>
          <p className="text-gray-600 mt-1">
            {selectedCourseId === 'all' 
              ? 'Monitor AI model usage and costs across the entire platform'
              : `Monitor AI model usage and costs for ${courses.find(c => c.id === selectedCourseId)?.title || 'selected course'}`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Course Filter */}
          <div className="flex items-center space-x-2">
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={coursesLoading}
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.course_code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {showCustomDate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={handleCustomDateSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Cost
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(summary.totalCost)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Interactions
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatNumber(summary.totalInteractions)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Tokens
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatNumber(summary.totalInputTokens + summary.totalOutputTokens)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Est. Monthly Cost
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatCurrency(summary.estimatedMonthlyCost)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className={`grid grid-cols-1 ${selectedCourseId === 'all' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-8`}>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Model</h3>
          <div className="space-y-4">
            {Object.entries(breakdown.byModel)
              .sort(([,a], [,b]) => b.cost - a.cost)
              .map(([modelName, data]) => (
                <div key={modelName} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{modelName}</span>
                      <span className="text-sm text-gray-500">{formatCurrency(data.cost)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatNumber(data.interactions)} interactions</span>
                      <span>{formatNumber(data.inputTokens + data.outputTokens)} tokens</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(data.cost / summary.totalCost) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Provider</h3>
          <div className="space-y-4">
            {Object.entries(breakdown.byProvider)
              .sort(([,a], [,b]) => b.cost - a.cost)
              .map(([provider, data]) => (
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{provider}</span>
                      <span className="text-sm text-gray-500">{formatCurrency(data.cost)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatNumber(data.interactions)} interactions</span>
                      <span>{formatNumber(data.inputTokens + data.outputTokens)} tokens</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${(data.cost / summary.totalCost) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Course Breakdown - only show when viewing all courses */}
        {selectedCourseId === 'all' && breakdown.byCourse && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Course</h3>
            <div className="space-y-4">
              {Object.entries(breakdown.byCourse)
                .sort(([,a], [,b]) => b.cost - a.cost)
                .slice(0, 10) // Show top 10 courses
                .map(([courseId, data]) => {
                  const course = courses.find(c => c.id === courseId) || { title: 'Unknown Course', course_code: 'N/A' };
                  return (
                    <div key={courseId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {course.title} ({course.course_code})
                          </span>
                          <span className="text-sm text-gray-500">{formatCurrency(data.cost)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>{formatNumber(data.interactions)} interactions</span>
                          <span>{formatNumber(data.inputTokens + data.outputTokens)} tokens</span>
                        </div>
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ 
                              width: `${(data.cost / summary.totalCost) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Efficiency</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg cost per interaction:</span>
              <span className="text-sm font-medium">{formatCurrency(summary.averageCostPerInteraction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg tokens per interaction:</span>
              <span className="text-sm font-medium">{formatNumber(summary.averageTokensPerInteraction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cost per 1K tokens:</span>
              <span className="text-sm font-medium">
                {formatCurrency((summary.totalCost / ((summary.totalInputTokens + summary.totalOutputTokens) / 1000)) || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Token Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Input tokens:</span>
              <span className="text-sm font-medium">{formatNumber(summary.totalInputTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Output tokens:</span>
              <span className="text-sm font-medium">{formatNumber(summary.totalOutputTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Input/Output ratio:</span>
              <span className="text-sm font-medium">
                {((summary.totalInputTokens / (summary.totalOutputTokens || 1))).toFixed(2)}:1
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time Period</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Days analyzed:</span>
              <span className="text-sm font-medium">{summary.daysInRange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg interactions/day:</span>
              <span className="text-sm font-medium">
                {formatNumber(summary.totalInteractions / summary.daysInRange)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg cost/day:</span>
              <span className="text-sm font-medium">
                {formatCurrency(summary.totalCost / summary.daysInRange)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}