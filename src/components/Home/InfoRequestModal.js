import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { sendContactNotification } from '../../services/contactEmailService';
import {
  XMarkIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  UserIcon,
  AcademicCapIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function InfoRequestModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.organization) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Save contact request to Firebase Firestore
      const docRef = await addDoc(collection(db, 'contactRequests'), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        organization: formData.organization.trim(),
        role: formData.role || null,
        message: formData.message.trim() || null,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('📝 Contact request saved successfully:', docRef.id);
      
      // Log success and show instructions for email notification
      console.log('📧 Contact request ready for notification - run: node send_contact_notifications.js');
      
      toast.success('Thank you! We\'ll be in touch soon.');
      setIsSubmitted(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit request. Please try again.');
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
              Request Submitted!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for your interest in AI Engagement Hub. We'll contact you soon with more information.
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
              Get More Information
            </h2>
            <p className="text-sm text-gray-600">
              Learn how AI Engagement Hub can transform your classroom
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School/Organization <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <BuildingOfficeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your school or organization"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Role
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select your role</option>
                <option value="teacher">Teacher</option>
                <option value="professor">Professor</option>
                <option value="administrator">Administrator</option>
                <option value="instructional-designer">Instructional Designer</option>
                <option value="it-director">IT Director</option>
                <option value="researcher">Researcher</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How can we help you?
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us about your needs, class size, or specific questions..."
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
                'Send Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}