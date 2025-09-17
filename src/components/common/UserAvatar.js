import React from 'react';
import Avatar from 'boring-avatars';

// Color palettes for different roles
const roleColors = {
  instructor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9'],
  teaching_assistant: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
  student_assistant: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857'],
  student: ['#f59e0b', '#fbbf24', '#fcd34d', '#f97316', '#ea580c'],
  admin: ['#ef4444', '#f87171', '#fca5a5', '#dc2626', '#b91c1c'],
  default: ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151']
};

export default function UserAvatar({
  name,
  email,
  role = 'student',
  size = 40,
  variant = 'beam' // beam, marble, pixel, sunset, ring, bauhaus
}) {
  // Use email as the unique identifier for consistency
  // Fall back to name if no email
  const identifier = email || name || 'user';

  // Get colors based on role
  const colors = roleColors[role] || roleColors.default;

  return (
    <Avatar
      size={size}
      name={identifier}
      variant={variant}
      colors={colors}
    />
  );
}

// Export role colors for consistency across the app
export { roleColors };