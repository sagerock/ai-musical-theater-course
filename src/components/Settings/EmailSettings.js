import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';

export default function EmailSettings() {
  const { currentUser, userRole } = useAuth();
  const [settings, setSettings] = useState({
    email_notifications_enabled: true,
    instructor_note_emails: true,
    new_project_emails: true,
    weekly_summary_emails: false,
    system_update_emails: true
  });
  const [loading, setLoading] = useState(true);

  // Detect if this is a Firebase user (Firebase UIDs don't follow UUID format)
  // Using Firebase API
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmailSettings();
  }, [currentUser?.id]);

  const loadEmailSettings = async () => {
    if (!currentUser) return;
    
    // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
    const isFirebaseUser = currentUser.id && !currentUser.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isFirebaseUser) {
      console.log('🔥 EmailSettings: Firebase user detected, using default settings');
      // For Firebase users, just use default settings without querying Supabase
      setLoading(false);
      return;
    }
    
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
    
    // Check if this is a Firebase user (Firebase UIDs don't follow UUID format)
    const isFirebaseUser = currentUser.id && !currentUser.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (isFirebaseUser) {
      toast.success('Email settings saved locally (Firebase user)');
      return;
    }
    
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
      title: 'Email notifications',
      description: 'The master switch. If this is off, everything below stays silent.',
      isMainToggle: true,
    },
    {
      key: 'instructor_note_emails',
      title: 'Instructor notes',
      description: 'Be notified when an instructor adds a note to one of your projects.',
      showFor: ['student'],
      dependsOn: 'email_notifications_enabled',
    },
    {
      key: 'new_project_emails',
      title: 'New projects',
      description: 'Be notified when students in your courses create new projects.',
      showFor: ['instructor', 'admin'],
      dependsOn: 'email_notifications_enabled',
    },
    {
      key: 'weekly_summary_emails',
      title: 'Weekly summary',
      description: 'A weekly digest of AI usage and activity, delivered on Mondays.',
      dependsOn: 'email_notifications_enabled',
    },
    {
      key: 'system_update_emails',
      title: 'System updates',
      description: 'Important platform updates and maintenance notices.',
      dependsOn: 'email_notifications_enabled',
    },
  ];

  const filteredSettings = settingsConfig.filter(setting => {
    if (setting.showFor && !setting.showFor.includes(userRole)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <section className="animate-pulse">
        <div className="flex items-baseline gap-6 md:gap-8">
          <div className="h-16 w-14 bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 bg-stone-200" />
            <div className="h-8 w-1/2 bg-stone-200" />
          </div>
        </div>
        <div className="mt-6 border-t border-[#e7e2d5]" />
        <div className="mt-2 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-6 border-b border-[#e7e2d5] flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-stone-200" />
                <div className="h-3 w-3/4 bg-stone-200" />
              </div>
              <div className="w-11 h-6 bg-stone-200 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-up animate-delay-2">
      {/* Section masthead */}
      <div className="flex items-baseline gap-6 md:gap-8">
        <p className="dashboard-display text-5xl md:text-6xl text-[#2a2359] leading-none flex-shrink-0">
          02
        </p>
        <div className="flex-1 min-w-0">
          <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500">
            Correspondence
          </p>
          <h2 className="dashboard-display text-3xl md:text-4xl text-stone-900 mt-1">
            What lands in your inbox.
          </h2>
        </div>
        <div className="flex-shrink-0 self-end pb-2">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-[#2a2359] border-b border-[#2a2359] pb-1 hover:text-[#3e3680] hover:border-[#3e3680] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save preferences →'}
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-[#e7e2d5]" />

      {/* Preference rows */}
      <ul className="mt-2">
        {filteredSettings.map((setting) => {
          const isDisabled = setting.dependsOn && !settings[setting.dependsOn];
          const isEnabled = settings[setting.key];
          const isActive = isEnabled && !isDisabled;

          return (
            <li
              key={setting.key}
              className={`py-6 border-b border-[#e7e2d5] flex items-start justify-between gap-8 ${
                isDisabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <p className="dashboard-mono text-[11px] tracking-[0.2em] uppercase text-stone-900">
                    {setting.title}
                  </p>
                  {setting.isMainToggle && (
                    <span className="dashboard-mono text-[9px] tracking-[0.18em] uppercase text-[#2a2359] border-b border-[#2a2359] pb-0.5">
                      Master
                    </span>
                  )}
                  {isDisabled && (
                    <span className="dashboard-mono text-[9px] tracking-[0.18em] uppercase text-stone-400">
                      — requires master
                    </span>
                  )}
                </div>
                <p className="mt-2 dashboard-serif-italic text-stone-600 text-[0.95rem] leading-relaxed max-w-xl">
                  {setting.description}
                </p>
              </div>

              <div className="flex-shrink-0 pt-1">
                <button
                  onClick={() => handleSettingChange(setting.key, !isEnabled)}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2a2359] focus-visible:ring-offset-[#faf7f2] ${
                    isActive ? 'bg-[#2a2359]' : 'bg-stone-300'
                  } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#faf7f2] shadow-sm transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Notes */}
      <div className="mt-8 max-w-2xl">
        <p className="dashboard-mono text-[9px] tracking-[0.24em] uppercase text-stone-500 mb-3">
          Notes
        </p>
        <ul className="space-y-2 dashboard-serif-italic text-stone-600 text-[0.95rem] leading-relaxed">
          <li className="flex gap-3"><span className="text-stone-400">—</span> Emails are sent from AI Engagement Hub to your registered address.</li>
          <li className="flex gap-3"><span className="text-stone-400">—</span> Update your email in the Profile section above.</li>
          <li className="flex gap-3"><span className="text-stone-400">—</span> Critical system notices may still arrive even with notifications off.</li>
          <li className="flex gap-3"><span className="text-stone-400">—</span> Changes take effect the moment you save.</li>
        </ul>
      </div>
    </section>
  );
}