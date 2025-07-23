import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/supabaseApi';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function EmailSettings() {
  const [settings, setSettings] = useState({
    email_notifications_enabled: true,
    instructor_note_emails: true,
    new_project_emails: true,
    weekly_summary_emails: false,
    system_update_emails: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    loadEmailSettings();
  }, [currentUser]);

  const loadEmailSettings = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userSettings = await userApi.getUserEmailSettings(currentUser.id);
      
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast.error('Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      await userApi.updateUserEmailSettings(currentUser.id, settings);
      toast.success('Email settings updated successfully!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const settingsConfig = [
    {
      key: 'email_notifications_enabled',
      title: 'Email Notifications',
      description: 'Enable all email notifications from AI Engagement Hub',
      icon: EnvelopeIcon,
      color: 'text-blue-500',
      isMainToggle: true
    },
    {
      key: 'instructor_note_emails',
      title: 'Instructor Note Notifications',
      description: 'Get notified when instructors add notes to your projects',
      icon: BellIcon,
      color: 'text-green-500',
      showFor: ['student'],
      dependsOn: 'email_notifications_enabled'
    },
    {
      key: 'new_project_emails',
      title: 'New Project Notifications',
      description: 'Get notified when students create new projects in your courses',
      icon: BellIcon,
      color: 'text-purple-500',
      showFor: ['instructor', 'admin'],
      dependsOn: 'email_notifications_enabled'
    },
    {
      key: 'weekly_summary_emails',
      title: 'Weekly Summary',
      description: 'Receive weekly summaries of AI usage and activity',
      icon: BellIcon,
      color: 'text-yellow-500',
      dependsOn: 'email_notifications_enabled'
    },
    {
      key: 'system_update_emails',
      title: 'System Updates',
      description: 'Important platform updates and maintenance notifications',
      icon: InformationCircleIcon,
      color: 'text-red-500',
      dependsOn: 'email_notifications_enabled'
    }
  ];

  const filteredSettings = settingsConfig.filter(setting => {
    if (setting.showFor && !setting.showFor.includes(userRole)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2 text-blue-500" />
            Email Preferences
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your email notification preferences
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {filteredSettings.map((setting) => {
          const Icon = setting.icon;
          const isDisabled = setting.dependsOn && !settings[setting.dependsOn];
          const isEnabled = settings[setting.key];

          return (
            <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon className={`h-6 w-6 ${setting.color} mt-0.5`} />
                <div>
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {setting.title}
                    </h4>
                    {setting.isMainToggle && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Master Control
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {setting.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => handleSettingChange(setting.key, !isEnabled)}
                  disabled={isDisabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isEnabled && !isDisabled
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled && !isDisabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                
                {isDisabled && (
                  <div className="ml-2 text-xs text-gray-500">
                    Requires main toggle
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Email Notifications</p>
            <ul className="space-y-1 text-xs">
              <li>• Emails are sent from AI Engagement Hub to your registered email address</li>
              <li>• You can update your email address in the Profile Settings section above</li>
              <li>• Critical system notifications may still be sent even with notifications disabled</li>
              <li>• Changes take effect immediately after saving</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}