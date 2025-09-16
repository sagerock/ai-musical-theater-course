import React, { useState } from 'react';
import { isExperimentalFeature } from '../../config/featureFlags';
import { AlertTriangle, BeakerIcon } from 'lucide-react';

/**
 * Example experimental feature component demonstrating proper feature flag usage
 *
 * This is a template for how experimental features should be implemented.
 * Replace this with your actual experimental feature.
 */
export default function ExampleFeature() {
  const [hasConsent, setHasConsent] = useState(false);

  // Check if feature is enabled via feature flag
  if (!isExperimentalFeature('EXAMPLE_FEATURE')) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-600">
          <BeakerIcon className="h-5 w-5" />
          <h3 className="font-semibold">Experimental Feature Not Available</h3>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This experimental feature is currently not enabled. It may be available in future releases.
        </p>
      </div>
    );
  }

  // Show opt-in consent for experimental features
  if (!hasConsent) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900">Experimental Feature Warning</h3>
            <p className="mt-2 text-sm text-yellow-800">
              This is an experimental feature that is still under development. By using this feature, you understand that:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-yellow-700 list-disc list-inside">
              <li>It may contain bugs or unexpected behavior</li>
              <li>It may be removed or changed significantly without notice</li>
              <li>It may impact system performance</li>
              <li>Support is limited and provided on a best-effort basis</li>
              <li>Your usage data will be collected to improve the feature</li>
            </ul>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => setHasConsent(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                I Understand, Enable Feature
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Actual experimental feature implementation
  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      {/* Beta Banner */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BeakerIcon className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">BETA FEATURE</span>
            <span className="text-xs text-purple-700">Expires: April 2025</span>
          </div>
          <a
            href="https://github.com/sagerock/ai-musical-theater-course/issues/new?template=feature_request.md&title=[FEEDBACK]%20Example%20Feature"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:text-purple-800 underline"
          >
            Provide Feedback
          </a>
        </div>
      </div>

      {/* Feature Content */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Example Experimental Feature</h2>

      <div className="space-y-4">
        <p className="text-gray-600">
          This is where your experimental feature implementation would go.
        </p>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-900">Implementation Guidelines:</h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc list-inside">
            <li>Keep it simple and focused on testing one concept</li>
            <li>Add analytics tracking to measure usage</li>
            <li>Include clear documentation of what's being tested</li>
            <li>Provide an easy way for users to give feedback</li>
            <li>Set clear success metrics (e.g., 20% adoption rate)</li>
          </ul>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            <strong>Metrics Being Tracked:</strong>
          </p>
          <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
            <li>Feature opens: Track every time this page is viewed</li>
            <li>Engagement: Track interactions with the feature</li>
            <li>Completion rate: Track successful uses vs. abandonment</li>
            <li>Error rate: Track any errors or issues</li>
            <li>Feedback: Collect qualitative feedback</li>
          </ul>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Feedback</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
            👍 Useful
          </button>
          <button className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
            🤔 Needs Work
          </button>
          <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
            👎 Not Helpful
          </button>
        </div>
      </div>
    </div>
  );
}