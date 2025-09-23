import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import errorLogger from '../../utils/errorLogger';
import { aiApi, AI_TOOLS } from '../../services/aiApi';
import { toast } from 'react-hot-toast';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AIDiagnostics = () => {
  const { currentUser } = useAuth();
  const [diagnosticMode, setDiagnosticMode] = useState(errorLogger.diagnosticMode);
  const [errorReport, setErrorReport] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    loadErrorReport();
  }, []);

  const loadErrorReport = () => {
    const report = errorLogger.getErrorReport();
    setErrorReport(report);
  };

  const toggleDiagnosticMode = () => {
    if (diagnosticMode) {
      errorLogger.disableDiagnosticMode();
      setDiagnosticMode(false);
      toast.success('Diagnostic mode disabled');
    } else {
      errorLogger.enableDiagnosticMode();
      setDiagnosticMode(true);
      toast.success('Diagnostic mode enabled - detailed logging active');
    }
  };

  const clearErrorLog = () => {
    if (window.confirm('Are you sure you want to clear the error log?')) {
      errorLogger.clearErrorLog();
      loadErrorReport();
      toast.success('Error log cleared');
    }
  };

  const downloadReport = () => {
    errorLogger.downloadErrorReport();
    toast.success('Error report downloaded');
  };

  const testAllModels = async () => {
    setTesting(true);
    setTestResults([]);

    // First check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost';

    if (isDevelopment) {
      // Check if API endpoints are available
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          toast.error('API endpoints not available in development. Please deploy to Vercel or run with Vercel CLI.');
          setTesting(false);
          return;
        }
      } catch (error) {
        toast.error('API endpoints not available. To test locally, run: vercel dev');
        setTesting(false);
        return;
      }
    }

    const models = Object.keys(AI_TOOLS);
    const results = [];

    for (const model of models) {
      try {
        const startTime = Date.now();
        const response = await aiApi.sendChatCompletion(
          'Say "Hello, I am working!" in exactly 5 words.',
          model,
          []
        );
        const duration = Date.now() - startTime;

        results.push({
          model,
          status: 'success',
          duration,
          response: response?.substring(0, 100)
        });
      } catch (error) {
        // Parse the error to get more details
        let errorMessage = error.message;
        if (error.message.includes('404')) {
          errorMessage = 'API endpoint not found - deployment required';
        } else if (error.message.includes('401')) {
          errorMessage = 'API key not configured';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out';
        }

        results.push({
          model,
          status: 'error',
          error: errorMessage,
          originalError: error.originalError?.message
        });
      }
      setTestResults([...results]);
    }

    setTesting(false);
  };

  // Only show to instructors or admins
  if (!currentUser || (currentUser.role !== 'instructor' && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">AI Model Diagnostics</h2>

        {/* Diagnostic Mode Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Diagnostic Mode</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enable detailed logging to help troubleshoot AI model issues
              </p>
            </div>
            <button
              onClick={toggleDiagnosticMode}
              className={`px-4 py-2 rounded-lg ${
                diagnosticMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {diagnosticMode ? 'Disable' : 'Enable'} Diagnostic Mode
            </button>
          </div>
          {diagnosticMode && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                📊 Diagnostic mode is active. Check the browser console for detailed API logs.
              </p>
            </div>
          )}
        </div>

        {/* Error Report */}
        {errorReport && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Error Report Summary</h3>
              <div className="space-x-2">
                <button
                  onClick={loadErrorReport}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                  Refresh
                </button>
                <button
                  onClick={downloadReport}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Download Report
                </button>
                <button
                  onClick={clearErrorLog}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Clear Log
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{errorReport.totalErrors}</div>
                <div className="text-sm text-gray-600">Total Errors</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">
                  {Object.keys(errorReport.errorsByModel).length}
                </div>
                <div className="text-sm text-gray-600">Models Affected</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">
                  {errorReport.commonPatterns.length}
                </div>
                <div className="text-sm text-gray-600">Patterns Detected</div>
              </div>
            </div>

            {/* Common Patterns */}
            {errorReport.commonPatterns.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Common Patterns</h4>
                <div className="space-y-2">
                  {errorReport.commonPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <div className="font-medium">{pattern.type}</div>
                        <div className="text-sm text-gray-700">{pattern.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Occurrences: {pattern.count}
                          {pattern.model && ` (${pattern.model})`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors by Model */}
            {Object.keys(errorReport.errorsByModel).length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Errors by Model</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(errorReport.errorsByModel).map(([model, count]) => (
                    <div key={model} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{model}:</span> {count}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Errors */}
            {errorReport.recentErrors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Errors</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {errorReport.recentErrors.map((error, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{error.model}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-700">{error.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Testing */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Model Connectivity Test</h3>
              <p className="text-sm text-gray-600 mt-1">
                Test all AI models to verify they are working correctly
              </p>
            </div>
            <button
              onClick={testAllModels}
              disabled={testing}
              className={`px-4 py-2 rounded-lg ${
                testing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {testing ? 'Testing...' : 'Test All Models'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    result.status === 'success'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center">
                    {result.status === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className="font-medium">{result.model}</span>
                  </div>
                  <div className="text-sm">
                    {result.status === 'success' ? (
                      <span className="text-green-700">
                        ✓ Working ({result.duration}ms)
                      </span>
                    ) : (
                      <span className="text-red-700">
                        ✗ {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deployment Status */}
        {window.location.hostname === 'localhost' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold mb-2 text-yellow-800">⚠️ Development Mode Detected</h4>
            <p className="text-sm text-yellow-700 mb-2">
              You're running the app locally. The AI API endpoints require deployment to work properly.
            </p>
            <div className="text-sm space-y-1">
              <p className="font-medium">To test AI models locally:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Install Vercel CLI: <code className="bg-white px-1 py-0.5 rounded">npm i -g vercel</code></li>
                <li>Run development server: <code className="bg-white px-1 py-0.5 rounded">vercel dev</code></li>
                <li>Set environment variables in Vercel dashboard</li>
              </ol>
              <p className="mt-2 font-medium">For production:</p>
              <p className="ml-2">Deploy to Vercel for full functionality</p>
            </div>
          </div>
        )}

        {/* Instructions for Students */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Troubleshooting Steps for Students</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Try refreshing the page (Ctrl/Cmd + R)</li>
            <li>Clear browser cache and cookies</li>
            <li>Try a different AI model</li>
            <li>Check internet connection</li>
            <li>Try using a different browser</li>
            <li>If issues persist, share the error message with your instructor</li>
          </ol>
        </div>

        {/* Debug URL */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug URL for Students:</strong>
          <code className="ml-2 bg-white px-2 py-1 rounded">
            {window.location.origin}/?debug=true
          </code>
          <p className="text-gray-600 mt-1">
            Share this URL with students experiencing issues to enable diagnostic logging
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIDiagnostics;