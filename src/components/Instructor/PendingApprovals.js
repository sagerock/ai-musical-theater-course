import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/supabaseApi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
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

  const { currentUser } = useAuth();

  useEffect(() => {
    if (courseId) {
      loadPendingRequests();
    }
  }, [courseId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await courseApi.getPendingApprovals(courseId, currentUser.uid);
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
      await courseApi.updateMembershipStatus(membershipId, status, currentUser.uid);
      
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
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      request.role === 'instructor' 
                        ? 'bg-green-100' 
                        : 'bg-blue-100'
                    }`}>
                      {request.role === 'instructor' ? (
                        <AcademicCapIcon className={`h-5 w-5 ${
                          request.role === 'instructor' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {request.users.name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        request.role === 'instructor' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {request.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {request.users.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Requested {format(new Date(request.joined_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApproval(request.id, 'rejected', request.users.name)}
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
                  
                  <button
                    onClick={() => handleApproval(request.id, 'approved', request.users.name)}
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
                </div>
              </div>
              
              {request.role === 'instructor' && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> This user is requesting instructor privileges. 
                    Only approve if you know they should have teaching access.
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