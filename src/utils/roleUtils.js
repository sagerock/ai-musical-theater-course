// Role utility functions for the new role system

export const ROLES = {
  STUDENT: 'student',
  STUDENT_ASSISTANT: 'student_assistant',
  TEACHING_ASSISTANT: 'teaching_assistant',
  INSTRUCTOR: 'instructor',
  SCHOOL_ADMINISTRATOR: 'school_administrator'
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.STUDENT_ASSISTANT]: 'Student Assistant',
  [ROLES.TEACHING_ASSISTANT]: 'Teaching Assistant',
  [ROLES.INSTRUCTOR]: 'Instructor',
  [ROLES.SCHOOL_ADMINISTRATOR]: 'School Administrator'
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.STUDENT]: 'Access course materials and AI tools',
  [ROLES.STUDENT_ASSISTANT]: 'Help manage course activities and assist other students',
  [ROLES.TEACHING_ASSISTANT]: 'Assist with grading and course management',
  [ROLES.INSTRUCTOR]: 'Full course management and administrative access',
  [ROLES.SCHOOL_ADMINISTRATOR]: 'Oversight and administrative access across courses'
};

// Role hierarchy for permissions (higher numbers = more permissions)
export const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 1,
  [ROLES.STUDENT_ASSISTANT]: 2,
  [ROLES.TEACHING_ASSISTANT]: 3,
  [ROLES.INSTRUCTOR]: 4,
  [ROLES.SCHOOL_ADMINISTRATOR]: 5
};

// Check if a role has instructor-level permissions
export function isInstructorLevel(role) {
  return role === 'admin' || [ROLES.INSTRUCTOR, ROLES.SCHOOL_ADMINISTRATOR].includes(role);
}

// Check if a role has assistant-level permissions
export function isAssistantLevel(role) {
  return [
    ROLES.STUDENT_ASSISTANT,
    ROLES.TEACHING_ASSISTANT,
    ROLES.INSTRUCTOR,
    ROLES.SCHOOL_ADMINISTRATOR
  ].includes(role);
}

// Check if a role has teaching permissions
export function hasTeachingPermissions(role) {
  return [
    ROLES.TEACHING_ASSISTANT,
    ROLES.INSTRUCTOR,
    ROLES.SCHOOL_ADMINISTRATOR
  ].includes(role);
}

// Check if a role has administrative permissions
export function hasAdminPermissions(role) {
  return role === 'admin' || [ROLES.INSTRUCTOR, ROLES.SCHOOL_ADMINISTRATOR].includes(role);
}

// Check if a role has student assistant permissions
export function hasStudentAssistantPermissions(role) {
  return [
    ROLES.STUDENT_ASSISTANT,
    ROLES.TEACHING_ASSISTANT,
    ROLES.INSTRUCTOR,
    ROLES.SCHOOL_ADMINISTRATOR
  ].includes(role);
}

// Check if role A has higher permissions than role B
export function hasHigherPermissions(roleA, roleB) {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

// Get role styling for UI components
export function getRoleStyle(role) {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case ROLES.SCHOOL_ADMINISTRATOR:
      return 'bg-purple-100 text-purple-800';
    case ROLES.INSTRUCTOR:
      return 'bg-green-100 text-green-800';
    case ROLES.TEACHING_ASSISTANT:
      return 'bg-orange-100 text-orange-800';
    case ROLES.STUDENT_ASSISTANT:
      return 'bg-yellow-100 text-yellow-800';
    case ROLES.STUDENT:
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

// Get role icon color
export function getRoleIconColor(role) {
  switch (role) {
    case 'admin':
      return 'text-red-600';
    case ROLES.SCHOOL_ADMINISTRATOR:
      return 'text-purple-600';
    case ROLES.INSTRUCTOR:
      return 'text-green-600';
    case ROLES.TEACHING_ASSISTANT:
      return 'text-orange-600';
    case ROLES.STUDENT_ASSISTANT:
      return 'text-yellow-600';
    case ROLES.STUDENT:
    default:
      return 'text-blue-600';
  }
}

// Normalize legacy role values to new system
export function normalizeRole(role) {
  // Handle legacy roles and ensure consistency
  switch (role) {
    case 'student':
      return ROLES.STUDENT;
    case 'instructor':
      return ROLES.INSTRUCTOR;
    case 'student_assistant':
      return ROLES.STUDENT_ASSISTANT;
    case 'teaching_assistant':
      return ROLES.TEACHING_ASSISTANT;
    case 'school_administrator':
      return ROLES.SCHOOL_ADMINISTRATOR;
    default:
      return ROLES.STUDENT; // Default fallback
  }
}

// Get display name for role
export function getRoleDisplayName(role) {
  if (role === 'admin') {
    return 'Global Administrator';
  }
  const normalizedRole = normalizeRole(role);
  return ROLE_LABELS[normalizedRole] || 'Unknown Role';
}

// Check if user can manage other users based on role
export function canManageRole(userRole, targetRole) {
  // Global admins can manage anyone
  if (userRole === 'admin') {
    return true;
  }
  
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedTargetRole = normalizeRole(targetRole);
  
  // School administrators can manage anyone
  if (normalizedUserRole === ROLES.SCHOOL_ADMINISTRATOR) {
    return true;
  }
  
  // Instructors can manage students, assistants, and other instructors
  if (normalizedUserRole === ROLES.INSTRUCTOR) {
    return [ROLES.STUDENT, ROLES.STUDENT_ASSISTANT, ROLES.TEACHING_ASSISTANT, ROLES.INSTRUCTOR].includes(normalizedTargetRole);
  }
  
  // Teaching assistants can manage students and student assistants
  if (normalizedUserRole === ROLES.TEACHING_ASSISTANT) {
    return [ROLES.STUDENT, ROLES.STUDENT_ASSISTANT].includes(normalizedTargetRole);
  }
  
  return false;
}