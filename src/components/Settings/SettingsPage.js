import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import EmailSettings from './EmailSettings';
import ProfileSettings from './ProfileSettings';
import {
  UserCircleIcon,
  EnvelopeIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences and notification settings
            </p>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <ProfileSettings />

      {/* Email Settings */}
      <EmailSettings />

      {/* Privacy Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
          Privacy & Data Protection
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-gray-700">
                <strong>Data Privacy:</strong> Your data is never used for AI model training by us or any of our AI providers.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-gray-700">
                <strong>Email Privacy:</strong> Email notifications are sent securely and only to your registered email address.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm text-gray-700">
                <strong>Data Control:</strong> You can manage your notification preferences and account settings at any time.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link 
            to="/privacy" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View full privacy policy →
          </Link>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Need Help?
        </h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            If you have questions about your account, privacy settings, or need technical support, here are some resources:
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/privacy" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Privacy Policy
            </Link>
            <a 
              href="mailto:support@aiengagementhub.com" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </a>
            <a 
              href="/dashboard" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}