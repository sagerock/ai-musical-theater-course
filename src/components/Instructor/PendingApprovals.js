import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/firebaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getRoleDisplayName, getRoleStyle, getRoleIconColor, isInstructorLevel } from '../../utils/roleUtils';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function PendingApprovals({ courseId, courseName }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [roleSelection, setRoleSelection] = useState({}); // Track role selection for each request

  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (courseId) {
      loadPendingRequests();
    }
  }, [courseId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await courseApi.getPendingApprovals(courseId, currentUser.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (membershipId, status, userName) => {
    setProcessing(prev => ({ ...prev, [membershipId]: true }));
    
    try {
      await courseApi.updateMembershipStatus(membershipId, status, currentUser.id);
      
      toast.success(
        `${userName} has been ${status === 'approved' ? 'approved' : 'rejected'}`
      );
      
      // Remove from pending list
      setPendingRequests(prev => 
        prev.filter(request => request.id !== membershipId)
      );
      
    } catch (error) {
      console.error('Error updating membership status:', error);
      toast.error(`Failed to ${status} member`);
    } finally {
      setProcessing(prev => ({ ...prev, [membershipId]: false }));
    }
  };

  // New handler for approving with specific role
  const handleApprovalWithRole = async (membershipId, role, userName) => {
    setProcessing(prev => ({ ...prev, [membershipId]: true }));
    
    try {
      // First approve the membership
      await courseApi.updateMembershipStatus(membershipId, 'approved', currentUser.id);
      
      // If the role is different from the requested role, update it
      const request = pendingRequests.find(r => r.id === membershipId);
      if (request && role !== request.role) {
        await courseApi.updateMemberRole(membershipId, role);
      }
      
      const roleDisplayName = getRoleDisplayName(role);
      toast.success(`${userName} has been approved as ${roleDisplayName}`);
      
      // Remove from pending list
      setPendingRequests(prev => 
        prev.filter(request => request.id !== membershipId)
      );
      
      // Clear role selection
      setRoleSelection(prev => ({ ...prev, [membershipId]: undefined }));
      
    } catch (error) {
      console.error('Error approving with role:', error);
      toast.error('Failed to approve member');
    } finally {
      setProcessing(prev => ({ ...prev, [membershipId]: false }));
    }
  };

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    if (userRole === 'admin') {
      // Global admins can assign any role
      return Object.values(ROLES);
    } else if (hasAdminPermissions(userRole)) {
      // Course instructors can assign most roles
      return [ROLES.STUDENT, ROLES.STUDENT_ASSISTANT, ROLES.TEACHING_ASSISTANT, ROLES.INSTRUCTOR];
    }
    
    return [ROLES.STUDENT]; // Default fallback
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Pending Approvals
          </h3>
          {pendingRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingRequests.length}
            </span>
          )}
        </div>
        {courseName && (
          <p className="text-sm text-gray-600 mt-1">
            Course: {courseName}
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {pendingRequests.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              All course requests have been processed.
            </p>
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getRoleStyle(request.role).replace('text-', 'bg-').replace('-800', '-100')}`}>
                      {isInstructorLevel(request.role) ? (
                        <AcademicCapIcon className={`h-5 w-5 ${getRoleIconColor(request.role)}`} />
                      ) : (
                        <UserIcon className={`h-5 w-5 ${getRoleIconColor(request.role)}`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {request.users?.name || 'Unknown User'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleStyle(request.role)}`}>
                        {getRoleDisplayName(request.role)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {request.users?.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Requested {format(new Date(request.joined_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproval(request.id, 'rejected', request.users?.name || 'Unknown User')}
                    disabled={processing[request.id]}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {processing[request.id] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                    ) : (
                      <>
                        <XCircleIcon className="h-3 w-3 mr-1" />
                        Reject
                      </>
                    )}
                  </button>
                  
                  {userRole === 'admin' || hasAdminPermissions(userRole) ? (
                    // Enhanced interface for admins with role selection
                    <div className="flex items-center space-x-1">
                      <div className="relative">
                        <select
                          value={roleSelection[request.id] || request.role}
                          onChange={(e) => setRoleSelection(prev => ({ 
                            ...prev, 
                            [request.id]: e.target.value 
                          }))}
                          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={processing[request.id]}
                        >
                          {getAvailableRoles().map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                      </div>
                      
                      <button
                        onClick={() => handleApprovalWithRole(
                          request.id, 
                          roleSelection[request.id] || request.role, 
                          request.users?.name || 'Unknown User'
                        )}
                        disabled={processing[request.id]}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {processing[request.id] ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                        ) : (
                          <>
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Approve
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    // Simple interface for regular users
                    <button
                      onClick={() => handleApproval(request.id, 'approved', request.users?.name || 'Unknown User')}
                      disabled={processing[request.id]}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {processing[request.id] ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Approve
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {isInstructorLevel(request.role) && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> This user is requesting {getRoleDisplayName(request.role)} privileges. 
                    Only approve if you know they should have this level of access.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}