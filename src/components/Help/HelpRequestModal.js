import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { sendHelpRequestNotification } from '../../services/contactEmailService';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function HelpRequestModal({ onClose }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const helpCategories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account & Login' },
    { value: 'courses', label: 'Course Management' },
    { value: 'ai-tools', label: 'AI Tools & Models' },
    { value: 'projects', label: 'Projects & Chat' },
    { value: 'billing', label: 'Billing & Pricing' },
    { value: 'feature-request', label: 'Feature Request' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.category || !formData.subject || !formData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Save help request to Firebase Firestore
      const docRef = await addDoc(collection(db, 'helpRequests'), {
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userName: currentUser?.displayName || currentUser?.email || 'Unknown User',
        category: formData.category,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        status: 'open',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('🎫 Help request saved successfully:', docRef.id);
      
      // Send email notification to admin
      try {
        await sendHelpRequestNotification({
          userName: currentUser?.displayName || currentUser?.email || 'Unknown User',
          userEmail: currentUser?.email || 'No email',
          category: formData.category,
          subject: formData.subject,
          description: formData.description,
          createdAt: new Date()
        });
        console.log('📧 Help request notification email sent successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to send help request notification email:', emailError);
        // Don't fail the form submission if email fails
      }
      
      toast.success('Help request submitted! We\'ll get back to you soon.');
      setIsSubmitted(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting help request:', error);
      toast.error('Failed to submit help request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Help Request Submitted!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for reaching out. Our support team will review your request and get back to you soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Contact Support
            </h2>
            <p className="text-sm text-gray-600">
              Get help with your AI Engagement Hub experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* User Info Display */}
          {currentUser && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Submitting as:</span> {currentUser.displayName || currentUser.email}
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What type of help do you need? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ExclamationCircleIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">Select a category</option>
                {helpCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ChatBubbleLeftRightIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your issue"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe your issue in detail. Include any error messages, steps you took, and what you expected to happen..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Help Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}