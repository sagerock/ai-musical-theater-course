# Role System Architecture Guide

## Overview

The AI Engagement Hub uses a comprehensive role-based access control (RBAC) system that provides granular permissions across the application. This guide explains how the role system works and how to add, modify, or update role permissions.

## Role Hierarchy

The system uses a hierarchical role structure with 5 distinct roles:

| Role | Level | Description | Permissions |
|------|-------|-------------|-------------|
| **Student** | 1 | Basic course participant | Course materials, AI tools, own projects |
| **Student Assistant** | 2 | Peer helper role | Student permissions + help other students |
| **Teaching Assistant** | 3 | Course support staff | Teaching permissions + view all student data |
| **Instructor** | 4 | Course teacher | Full course management + student management |
| **School Administrator** | 5 | Department/school oversight | Multi-course oversight + administrative functions |
| **Global Admin** | 6 | System administrator | Full system access + user management |

## System Components

### 1. Role Definitions (`src/utils/roleUtils.js`)

This is the central role configuration file:

```javascript
export const ROLES = {
  STUDENT: 'student',
  STUDENT_ASSISTANT: 'student_assistant', 
  TEACHING_ASSISTANT: 'teaching_assistant',
  INSTRUCTOR: 'instructor',
  SCHOOL_ADMINISTRATOR: 'school_administrator'
};

export const ROLE_HIERARCHY = {
  [ROLES.STUDENT]: 1,
  [ROLES.STUDENT_ASSISTANT]: 2,
  [ROLES.TEACHING_ASSISTANT]: 3,
  [ROLES.INSTRUCTOR]: 4,
  [ROLES.SCHOOL_ADMINISTRATOR]: 5
};
```

**Key Functions:**
- `hasTeachingPermissions(role)` - Checks if role can access teaching features
- `hasAdminPermissions(role)` - Checks if role can perform administrative tasks
- `canManageRole(userRole, targetRole)` - Determines role management permissions

### 2. Authentication Context (`src/contexts/AuthContext.js`)

Manages user authentication and role detection:

```javascript
// Checks if user has teaching permissions in ANY course
const checkInstructorStatus = async (userId) => {
  const membershipsQuery = query(
    collection(db, 'courseMemberships'),
    where('userId', '==', userId),
    where('status', '==', 'approved')
  );
  
  const membershipsSnapshot = await getDocs(membershipsQuery);
  const { hasTeachingPermissions } = await import('../utils/roleUtils');
  
  return membershipsSnapshot.docs.some(doc => {
    const membership = doc.data();
    return hasTeachingPermissions(membership.role);
  });
};
```

### 3. Firebase Security Rules (`firestore.rules`)

Database-level permission enforcement:

```javascript
// Helper function for teaching permissions in courses
function hasTeachingPermissionsInCourse(courseId) {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/courseMemberships/$(request.auth.uid + '_' + courseId)) &&
         get(/databases/$(database)/documents/courseMemberships/$(request.auth.uid + '_' + courseId)).data.role in ['teaching_assistant', 'instructor', 'school_administrator'] &&
         get(/databases/$(database)/documents/courseMemberships/$(request.auth.uid + '_' + courseId)).data.status == 'approved';
}
```

### 4. Cloud Functions (`functions/index.js`)

Server-side permission validation:

```javascript
// Analytics generation permissions
if (!['instructor', 'teaching_assistant', 'school_administrator', 'admin'].includes(membership.role)) {
  throw new HttpsError('permission-denied', 'Only instructors, teaching assistants, and admins can generate analytics');
}
```

## Role Permission Matrix

| Feature | Student | Student Assistant | Teaching Assistant | Instructor | School Admin | Global Admin |
|---------|---------|-------------------|-------------------|------------|--------------|--------------|
| **Authentication & Profile** |
| Create account | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other profiles | ❌ | ❌ | Course only | Course only | Multi-course | All |
| **Course Access** |
| Join courses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View course materials | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create courses | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Student Data Access** |
| View own data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other student data | ❌ | Limited | Course only | Course only | Multi-course | All |
| Export student data | ❌ | ❌ | Course only | Course only | Multi-course | All |
| **AI Tools & Projects** |
| Use AI tools | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all projects | ❌ | ❌ | Course only | Course only | Multi-course | All |
| **Instructor Dashboard** |
| Access dashboard | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| AI Assistant | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Student Management** |
| View student list | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve students | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Remove students | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Change student roles | ❌ | ❌ | Limited* | ✅ | ✅ | ✅ |
| **Course Management** |
| Edit course settings | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage tags | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Course analytics | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **System Administration** |
| User management | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Global admin panel | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*Limited: Teaching Assistants can only manage Students and Student Assistants

## Adding a New Role

### Step 1: Define the Role

Add to `src/utils/roleUtils.js`:

```javascript
export const ROLES = {
  // ... existing roles
  NEW_ROLE: 'new_role_name'
};

export const ROLE_LABELS = {
  // ... existing labels
  [ROLES.NEW_ROLE]: 'Display Name'
};

export const ROLE_HIERARCHY = {
  // ... existing hierarchy
  [ROLES.NEW_ROLE]: 3.5  // Position in hierarchy
};
```

### Step 2: Update Permission Functions

Modify permission functions in `roleUtils.js`:

```javascript
export function hasSpecialPermission(role) {
  return [
    ROLES.NEW_ROLE,
    ROLES.INSTRUCTOR,
    ROLES.SCHOOL_ADMINISTRATOR
  ].includes(role);
}
```

### Step 3: Update Firebase Security Rules

Add role to relevant rules in `firestore.rules`:

```javascript
function hasNewRolePermissions() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['new_role_name', 'instructor', 'school_administrator'];
}
```

### Step 4: Update Cloud Functions

Add role to Cloud Function permissions in `functions/index.js`:

```javascript
const allowedRoles = ['instructor', 'teaching_assistant', 'new_role_name', 'school_administrator', 'admin'];
if (!allowedRoles.includes(membership.role)) {
  throw new HttpsError('permission-denied', 'Insufficient permissions');
}
```

### Step 5: Update UI Components

Add role-specific UI logic:

```javascript
// In React components
import { hasSpecialPermission } from '../utils/roleUtils';

const canAccessFeature = hasSpecialPermission(currentUser?.role);

return (
  <div>
    {canAccessFeature && (
      <SpecialFeatureComponent />
    )}
  </div>
);
```

### Step 6: Update Student Management

Add role to filtering in `Students.js`:

```javascript
case 'new_role_name':
  newRoleUsers.push(user);
  break;
```

### Step 7: Deploy Changes

Deploy all changes:

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy cloud functions  
firebase deploy --only functions

# Deploy frontend (if using Firebase Hosting)
npm run build
firebase deploy --only hosting
```

## Modifying Existing Role Permissions

### Adding a Permission

1. **Update permission function** in `roleUtils.js`
2. **Update Firebase Security Rules** for database access
3. **Update Cloud Functions** for server-side operations
4. **Update UI components** for client-side display

### Example: Allow Teaching Assistants to Delete Students

```javascript
// 1. Update component permission check
const canDeleteStudents = hasAdminPermissions(currentUser?.role) || 
                         currentUser?.role === 'admin' ||
                         currentUser?.role === 'teaching_assistant';  // NEW

// 2. Update UI rendering
{canDeleteStudents && (
  <DeleteButton onClick={handleDelete} />
)}

// 3. Update Cloud Function (if applicable)
const allowedRoles = ['instructor', 'teaching_assistant', 'school_administrator', 'admin'];
```

## Role Assignment Process

### Course-Level Roles

1. **Membership Creation**: User requests to join course
2. **Role Assignment**: Instructor/Admin assigns specific course role
3. **Status Approval**: Membership status changed from 'pending' to 'approved'
4. **Permission Activation**: User gains permissions based on course role

### Global Roles

1. **User Creation**: Account created with default 'student' role
2. **Admin Assignment**: Global admin promotes user to higher role
3. **Cross-Course Permissions**: Role applies across all courses

## Debugging Role Issues

### Common Issues

1. **Permission Denied Errors**
   - Check Firebase Security Rules
   - Verify Cloud Function permissions
   - Confirm role assignment in database

2. **UI Not Updating**
   - Check React component permission logic
   - Verify AuthContext role detection
   - Refresh browser to reload user data

3. **Database Access Issues**
   - Review Firestore security rules
   - Check membership document structure
   - Verify role field naming consistency

### Debugging Tools

```javascript
// Add to components for debugging
console.log('🔍 User role debug:', {
  globalRole: currentUser?.role,
  courseRole: membership?.role,
  hasTeachingPermissions: hasTeachingPermissions(currentUser?.role),
  isInstructorAnywhere: isInstructorAnywhere
});
```

## Security Best Practices

### 1. Defense in Depth
- **Client-side**: UI permission checks for user experience
- **Security Rules**: Database-level access control
- **Cloud Functions**: Server-side validation for sensitive operations

### 2. Principle of Least Privilege
- Grant minimum permissions necessary for role function
- Regular review of role permissions
- Explicit deny by default

### 3. Role Validation
- Always validate roles on both client and server
- Never trust client-side role claims alone
- Use server-side validation for critical operations

### 4. Audit Trail
- Log all role changes
- Track permission escalations
- Monitor access patterns

## Testing Role Permissions

### Manual Testing Checklist

For each new role or permission change:

- [ ] Create test user with the role
- [ ] Verify Firebase Auth profile shows correct role
- [ ] Test course membership with role
- [ ] Check UI elements display correctly
- [ ] Verify database access permissions
- [ ] Test Cloud Function access
- [ ] Confirm email notifications work
- [ ] Validate cross-role interactions

### Automated Testing (Future Enhancement)

```javascript
// Example test structure
describe('Role Permissions', () => {
  test('Teaching Assistant can access instructor dashboard', async () => {
    const user = await createTestUser('teaching_assistant');
    const dashboard = await accessInstructorDashboard(user);
    expect(dashboard).toBeDefined();
  });
  
  test('Teaching Assistant cannot delete students', async () => {
    const ta = await createTestUser('teaching_assistant');
    const result = await attemptStudentDeletion(ta, studentId);
    expect(result).toThrow('Insufficient permissions');
  });
});
```

## Migration Guide

When updating the role system:

### 1. Data Migration
```javascript
// Example: Adding new role to existing users
const batch = db.batch();
const usersQuery = db.collection('users').where('oldRole', '==', 'old_value');
const users = await usersQuery.get();

users.forEach(doc => {
  batch.update(doc.ref, { role: 'new_role_name' });
});

await batch.commit();
```

### 2. Gradual Rollout
1. Deploy backend changes first
2. Test with limited users
3. Deploy frontend changes
4. Monitor for issues
5. Full deployment

### 3. Rollback Plan
- Keep backup of previous security rules
- Document all changes made
- Test rollback procedure in development

## Conclusion

This role system provides a flexible, secure foundation for managing user permissions in the AI Engagement Hub. By following this guide, you can safely add new roles, modify permissions, and maintain security best practices.

For questions or issues with the role system, refer to the debugging section or consult the development team.

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Maintainer**: Development Team