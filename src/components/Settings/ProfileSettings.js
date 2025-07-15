import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/supabaseApi';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase';
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
  const { currentUser, userRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  
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
      const userData = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        bio: '' // We can add bio to the user profile later if needed
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [currentUser]);

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
        await updateProfile(currentUser, {
          displayName: formData.displayName
        });
        
        // Also update in Supabase
        await userApi.updateUserProfile(currentUser.uid, {
          display_name: formData.displayName
        });
      }

      // Update email if changed (requires verification)
      if (formData.email !== originalData.email) {
        try {
          await updateEmail(currentUser, formData.email);
          
          // Send verification email
          await sendEmailVerification(currentUser);
          setEmailVerificationSent(true);
          emailChanged = true;
          
          // Update in Supabase
          await userApi.updateUserProfile(currentUser.uid, {
            email: formData.email
          });
          
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
    setEmailVerificationSent(false);
  };

  const handleResendVerification = async () => {
    if (!currentUser) return;
    
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error('Failed to send verification email. Please try again.');
    }
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
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-900">
                {formData.email}
              </p>
              {currentUser?.emailVerified ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Unverified
                </span>
              )}
            </div>
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

      {/* Email Verification Notice */}
      {emailVerificationSent && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <EnvelopeIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Verification Email Sent
              </p>
              <p className="text-sm text-blue-700 mt-1">
                We've sent a verification email to your new email address. Please check your inbox and click the verification link.
              </p>
              <button
                onClick={handleResendVerification}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                Resend verification email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unverified Email Warning */}
      {!currentUser?.emailVerified && !emailVerificationSent && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Email Not Verified
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Your email address hasn't been verified yet. Verify your email to ensure you receive important notifications.
              </p>
              <button
                onClick={handleResendVerification}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium mt-2"
              >
                Send verification email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-gray-600 mt-0.5 mr-3" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Profile Update Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• Your display name will be shown to instructors and in course interactions</li>
              <li>• Email changes require verification before taking effect</li>
              <li>• You may need to sign out and back in to change your email address</li>
              <li>• Your role is set by course instructors and cannot be changed here</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}