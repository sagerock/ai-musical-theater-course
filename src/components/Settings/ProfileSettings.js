import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/firebaseApi';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
            Profile Settings
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Update your personal information and account details
          </p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          {isEditing ? (
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your display name"
            />
          ) : (
            <p className="text-sm text-gray-900 py-2">
              {formData.displayName || 'Not provided'}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          {isEditing ? (
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing your email will require verification
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-900 py-2">
              {formData.email}
            </p>
          )}
        </div>

        {/* Role (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <p className="text-sm text-gray-900 py-2 capitalize">
            {userRole}
          </p>
        </div>

        {/* Account Created */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Created
          </label>
          <p className="text-sm text-gray-900 py-2">
            {currentUser?.metadata?.creationTime 
              ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'Unknown'
            }
          </p>
        </div>

        {/* Last Sign In */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Sign In
          </label>
          <p className="text-sm text-gray-900 py-2">
            {currentUser?.metadata?.lastSignInTime 
              ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Unknown'
            }
          </p>
        </div>
      </div>


      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-gray-600 mt-0.5 mr-3" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Profile Update Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• Your display name will be shown to instructors and in course interactions</li>
              <li>• Email verification is handled automatically during account creation</li>
              <li>• You may need to sign out and back in to change your email address</li>
              <li>• Your role is set by course instructors and cannot be changed here</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}