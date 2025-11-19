import React, { useState } from 'react';
import { apiHealthCheck } from '../../services/apiHealthCheck';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function ApiHealthCheck() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [lastRun, setLastRun] = useState(null);

  const runHealthCheck = async () => {
    setTesting(true);
    try {
      const summary = await apiHealthCheck.testAll();
      setResults(summary);
      setLastRun(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (success) => {
    return success ? 'bg-green-50' : 'bg-red-50';
  };

  const getStatusBorder = (success) => {
    return success ? 'border-green-200' : 'border-red-200';
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API Health Check</h2>
            <p className="mt-1 text-sm text-gray-600">
              Test connectivity to all AI provider APIs
            </p>
            {lastRun && (
              <p className="mt-1 text-xs text-gray-500">
                Last run: {lastRun.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={runHealthCheck}
            disabled={testing}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Run Health Check'}
          </button>
        </div>

        {/* Summary */}
        {results && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-gray-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total APIs</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{results.total}</dd>
            </div>
            <div className="bg-green-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-green-600 truncate">Successful</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-900">{results.successful}</dd>
            </div>
            <div className="bg-red-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-red-600 truncate">Failed</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-900">{results.failed}</dd>
            </div>
            <div className="bg-blue-50 overflow-hidden rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-blue-600 truncate">Avg Response</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-900">
                {formatDuration(results.averageDuration)}
              </dd>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {results && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Provider Details</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`p-6 ${getStatusBg(result.success)} border-l-4 ${getStatusBorder(result.success)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {result.success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-lg font-semibold ${getStatusColor(result.success)}`}>
                          {result.provider}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {result.model}
                        </span>
                      </div>

                      {result.success ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Response:</span>{' '}
                            <span className="text-gray-600">{result.response}</span>
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Response time: {formatDuration(result.duration)}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-start">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Error Details:</p>
                              <p className="text-sm text-red-700 mt-1">{result.error}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Failed after: {formatDuration(result.duration)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Troubleshooting tips for failures */}
                {!result.success && (
                  <div className="mt-4 bg-white rounded-md p-4 border border-red-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Troubleshooting:</h5>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      {result.error?.includes('not configured') && (
                        <li>Check that the API key is set in Vercel environment variables</li>
                      )}
                      {result.error?.includes('401') || result.error?.includes('unauthorized') && (
                        <>
                          <li>Verify the API key is correct and not expired</li>
                          <li>Check that the API key has proper permissions</li>
                        </>
                      )}
                      {result.error?.includes('429') || result.error?.includes('rate limit') && (
                        <li>Rate limit exceeded - wait a moment and try again</li>
                      )}
                      {result.error?.includes('500') || result.error?.includes('503') && (
                        <li>Provider service is experiencing issues - try again later</li>
                      )}
                      {result.error?.includes('timeout') && (
                        <li>Request timed out - the API may be slow or overloaded</li>
                      )}
                      <li>Environment variable name should be: {result.provider.toUpperCase()}_API_KEY</li>
                      <li>Ensure the API key has no extra spaces or quotes</li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !testing && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No health check results</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Run Health Check" to test all AI provider APIs
          </p>
        </div>
      )}
    </div>
  );
}
