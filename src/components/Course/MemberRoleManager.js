import React, { useState } from 'react';
import { courseApi } from '../../services/firebaseApi';
import { 
  getRoleDisplayName, 
  getRoleStyle, 
  getRoleIconColor, 
  ROLES, 
  ROLE_LABELS,
  canManageRole,
  hasAdminPermissions
} from '../../utils/roleUtils';
import toast from 'react-hot-toast';
import {
  UserIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function MemberRoleManager({ member, currentUserRole, onRoleUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [updating, setUpdating] = useState(false);

  // Check if current user can manage this member's role
  const canManage = canManageRole(currentUserRole, member.role);

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    const roles = [];
    
    // Always include student role
    roles.push(ROLES.STUDENT);
    
    // Add roles based on current user's permissions
    if (currentUserRole === 'admin' || currentUserRole === ROLES.SCHOOL_ADMINISTRATOR) {
      // Global admins and school administrators can assign any role
      roles.push(ROLES.STUDENT_ASSISTANT);
      roles.push(ROLES.TEACHING_ASSISTANT);
      roles.push(ROLES.INSTRUCTOR);
      roles.push(ROLES.SCHOOL_ADMINISTRATOR);
    } else if (currentUserRole === ROLES.INSTRUCTOR) {
      // Instructors can assign student and assistant roles, and other instructor roles
      roles.push(ROLES.STUDENT_ASSISTANT);
      roles.push(ROLES.TEACHING_ASSISTANT);
      roles.push(ROLES.INSTRUCTOR);
    } else if (hasAdminPermissions(currentUserRole)) {
      // Other admin-level roles can assign assistant roles
      roles.push(ROLES.STUDENT_ASSISTANT);
      roles.push(ROLES.TEACHING_ASSISTANT);
    }
    
    return roles;
  };

  const handleRoleChange = async () => {
    if (selectedRole === member.role) {
      setIsEditing(false);
      return;
    }

    setUpdating(true);
    try {
      // Get the membership ID from the member object
      const membershipId = member.course_memberships?.[0]?.id || 
                          `${member.id}_${member.course_memberships?.[0]?.courseId || member.course_memberships?.[0]?.course_id}`;
      
      console.log('🔧 Updating role for membership:', membershipId);
      
      await courseApi.updateMemberRole(membershipId, selectedRole);
      toast.success(`${member.name || member.users?.name}'s role updated to ${getRoleDisplayName(selectedRole)}`);
      
      // Update the member's role locally for immediate UI feedback
      member.role = selectedRole;
      if (member.course_memberships?.[0]) {
        member.course_memberships[0].role = selectedRole;
      }
      if (member.course_role !== undefined) {
        member.course_role = selectedRole;
      }
      
      // Call parent callback to refresh data with a small delay to ensure DB update is complete
      if (onRoleUpdated) {
        setTimeout(() => {
          onRoleUpdated();
        }, 1000); // 1 second delay to ensure Firestore update is fully propagated
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
      setSelectedRole(member.role); // Reset to original
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(member.role);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={updating}
          >
            {getAvailableRoles().map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        
        <button
          onClick={handleRoleChange}
          disabled={updating}
          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {updating ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <CheckIcon className="h-3 w-3" />
          )}
        </button>
        
        <button
          onClick={handleCancel}
          disabled={updating}
          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleStyle(member.role)}`}>
        {getRoleDisplayName(member.role)}
      </span>
      
      {canManage && (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit
        </button>
      )}
    </div>
  );
}