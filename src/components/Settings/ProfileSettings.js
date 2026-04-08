import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function ProfileSettings() {
  const { currentUser, userRole, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Using Firebase API
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: ''
  });

  const [originalData, setOriginalData] = useState({
    displayName: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    if (currentUser) {
      // Using Firebase user data
      
      const userData = {
        displayName: currentUser.name || currentUser.displayName || '',
        email: currentUser.email || '',
        bio: '' // We can add bio to the user profile later if needed
      };
      
      // Only update if data has actually changed to prevent infinite loops
      if (JSON.stringify(userData) !== JSON.stringify(formData)) {
        setFormData(userData);
        setOriginalData(userData);
      }
    }
  }, [currentUser?.id, currentUser?.email, currentUser?.displayName, currentUser?.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let emailChanged = false;
      
      // Update display name if changed
      if (formData.displayName !== originalData.displayName) {
        await updateProfile({
          display_name: formData.displayName
        });
      }

      // Update email if changed (requires verification)
      if (formData.email !== originalData.email) {
        try {
          await updateProfile({
            email: formData.email
          });
          
          emailChanged = true;
          
          toast.success('Email updated! Please check your inbox for verification.');
        } catch (emailError) {
          console.error('Email update error:', emailError);
          
          if (emailError.code === 'auth/requires-recent-login') {
            toast.error('Please sign out and sign back in to change your email address.');
          } else if (emailError.code === 'auth/email-already-in-use') {
            toast.error('This email address is already in use by another account.');
          } else {
            toast.error('Failed to update email. Please try again.');
          }
          
          // Revert email change in form
          setFormData(prev => ({
            ...prev,
            email: originalData.email
          }));
          return;
        }
      }

      // Update original data to reflect changes
      setOriginalData({ ...formData });
      setIsEditing(false);
      
      if (!emailChanged) {
        toast.success('Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setIsEditing(false);
  };


  const hasChanges = () => {
    return formData.displayName !== originalData.displayName ||
           formData.email !== originalData.email ||
           formData.bio !== originalData.bio;
  };

  const formatDate = (value, withTime = false) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
    });
  };

  return (
    <section className="animate-fade-up animate-delay-1">
      {/* Section masthead */}
      <div className="flex items-baseline gap-6 md:gap-8">
        <p className="dashboard-display text-5xl md:text-6xl text-[#2a2359] leading-none flex-shrink-0">
          01
        </p>
        <div className="flex-1 min-w-0">
          <p className="dashboard-mono text-[10px] tracking-[0.24em] uppercase text-stone-500">
            Profile
          </p>
          <h2 className="dashboard-display text-3xl md:text-4xl text-stone-900 mt-1">
            Who you are here.
          </h2>
        </div>
        <div className="flex-shrink-0 self-end pb-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="group inline-flex items-center dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-900 border-b border-stone-900 pb-1 hover:text-[#2a2359] hover:border-[#2a2359] transition-colors"
            >
              <PencilIcon className="h-3 w-3 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-6">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !hasChanges()}
                className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-[#2a2359] border-b border-[#2a2359] pb-1 hover:text-[#3e3680] hover:border-[#3e3680] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving…' : 'Save changes →'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[#e7e2d5]" />

      {/* Fields */}
      <dl className="mt-2">
        {/* Display Name */}
        <div className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[220px_1fr] md:gap-12 md:items-baseline">
          <dt className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2 md:mb-0">
            Display name
          </dt>
          <dd>
            {isEditing ? (
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                className="w-full max-w-xl bg-transparent border-0 border-b border-stone-300 py-2 dashboard-display text-2xl md:text-[1.75rem] text-stone-900 focus:outline-none focus:border-[#2a2359] placeholder:text-stone-300 transition-colors"
              />
            ) : (
              <p className="dashboard-display text-2xl md:text-[1.75rem] text-stone-900 leading-tight">
                {formData.displayName || <span className="text-stone-300">Unnamed reader</span>}
              </p>
            )}
          </dd>
        </div>

        {/* Email */}
        <div className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[220px_1fr] md:gap-12 md:items-baseline">
          <dt className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2 md:mb-0">
            Email address
          </dt>
          <dd>
            {isEditing ? (
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full max-w-xl bg-transparent border-0 border-b border-stone-300 py-2 dashboard-display text-xl md:text-2xl text-stone-900 focus:outline-none focus:border-[#2a2359] placeholder:text-stone-300 transition-colors"
                />
                <p className="mt-3 dashboard-serif-italic text-stone-500 text-sm">
                  Changing your email will require verification from your inbox.
                </p>
              </div>
            ) : (
              <p className="dashboard-display text-xl md:text-2xl text-stone-900 break-all">
                {formData.email}
              </p>
            )}
          </dd>
        </div>

        {/* Role (Read-only) */}
        <div className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[220px_1fr] md:gap-12 md:items-baseline">
          <dt className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2 md:mb-0">
            Role
          </dt>
          <dd className="flex items-baseline gap-4">
            <p className="dashboard-display text-xl md:text-2xl text-stone-900 capitalize">
              {userRole || 'student'}
            </p>
            <span className="dashboard-mono text-[9px] tracking-[0.2em] uppercase text-stone-400">
              Assigned by your instructor
            </span>
          </dd>
        </div>

        {/* Account Created */}
        <div className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[220px_1fr] md:gap-12 md:items-baseline">
          <dt className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2 md:mb-0">
            Joined
          </dt>
          <dd className="dashboard-mono text-sm text-stone-700 tabular-nums">
            {formatDate(currentUser?.metadata?.creationTime)}
          </dd>
        </div>

        {/* Last Sign In */}
        <div className="py-6 border-b border-[#e7e2d5] grid grid-cols-1 md:grid-cols-[220px_1fr] md:gap-12 md:items-baseline">
          <dt className="dashboard-mono text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2 md:mb-0">
            Last sign in
          </dt>
          <dd className="dashboard-mono text-sm text-stone-700 tabular-nums">
            {formatDate(currentUser?.metadata?.lastSignInTime, true)}
          </dd>
        </div>
      </dl>

      {/* Notes */}
      <div className="mt-8 max-w-2xl">
        <p className="dashboard-mono text-[9px] tracking-[0.24em] uppercase text-stone-500 mb-3">
          Notes
        </p>
        <ul className="space-y-2 dashboard-serif-italic text-stone-600 text-[0.95rem] leading-relaxed">
          <li className="flex gap-3"><span className="text-stone-400">—</span> Your display name is how instructors and classmates see you.</li>
          <li className="flex gap-3"><span className="text-stone-400">—</span> You may need to sign out and back in to change your email address.</li>
          <li className="flex gap-3"><span className="text-stone-400">—</span> Your role is set by a course instructor; it cannot be edited from here.</li>
        </ul>
      </div>
    </section>
  );
}