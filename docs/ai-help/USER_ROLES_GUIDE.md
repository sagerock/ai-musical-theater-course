# AI Engagement Hub User Roles Guide

## Table of Contents
1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Detailed Role Descriptions](#detailed-role-descriptions)
4. [How to Assign Roles](#how-to-assign-roles)
5. [Common Questions](#common-questions)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Overview

AI Engagement Hub uses a role-based access control system to manage permissions and capabilities within the platform. Each role is designed to support different responsibilities in the educational environment.

### Quick Reference
- **Student** - Default role for learners
- **Student Assistant** - Students who help peers
- **Teaching Assistant** - Support instructors with course management
- **Instructor** - Full course control and student management
- **School Administrator** - Institutional oversight
- **Global Administrator** - Platform-wide control

## Role Hierarchy

```
Global Administrator
    ↓
School Administrator
    ↓
Instructor
    ↓
Teaching Assistant
    ↓
Student Assistant
    ↓
Student
```

Higher roles inherit all permissions from lower roles.

## Detailed Role Descriptions

### 🎓 Student (Default Role)

**Purpose**: Standard learner role for course participants

**Capabilities**:
- Create and manage own projects
- Use all AI models for learning
- Submit reflections on AI interactions
- View own analytics and progress
- Upload PDFs for AI analysis
- Join courses with access codes
- Request enrollment in courses

**Limitations**:
- Cannot view other students' work
- Cannot access course analytics
- Cannot approve enrollments
- Cannot create or manage courses

**Best For**: Regular course participants focused on their own learning journey

### 🤝 Student Assistant

**Purpose**: Peer support role for students helping classmates

**Capabilities** (includes all Student permissions plus):
- View all projects in their courses (read-only)
- Access course member list
- See other students' AI interactions (read-only)
- Help peers with their projects
- Provide peer tutoring and support

**Limitations**:
- Cannot edit other students' work
- Cannot approve enrollments
- Cannot access instructor features
- Cannot view course analytics

**Best For**: 
- Peer tutors
- Study group leaders
- Students excelling in the course who can help others
- Teaching assistant candidates

### 🧑‍🏫 Teaching Assistant

**Purpose**: Support instructors with course management

**Capabilities** (includes all Student Assistant permissions plus):
- View complete course analytics
- Access all student projects and interactions
- Approve or deny enrollment requests
- Monitor student activity and engagement
- Add instructor notes to student work
- Manage course tags
- View student reflections
- Access AI usage analytics

**Limitations**:
- Cannot delete courses
- Cannot remove instructors
- Cannot assign School Administrator role
- Cannot access platform-wide settings

**Best For**:
- Graduate students assisting with courses
- Junior instructors learning course management
- Lab assistants
- Course facilitators

### 👨‍🏫 Instructor

**Purpose**: Full course management and teaching capabilities

**Capabilities** (includes all Teaching Assistant permissions plus):
- Create new courses
- Edit course details (name, description, school)
- Assign roles to course members (except School Admin)
- Remove students from courses
- Download course data
- Send announcements to students
- Full control over course settings
- Co-instructor collaboration

**Limitations**:
- Cannot delete other instructors' courses
- Cannot assign School Administrator role
- Cannot access courses outside their enrollment
- Cannot modify platform settings

**Best For**:
- Course professors
- Lead teachers
- Workshop facilitators
- Course creators

### 🏫 School Administrator

**Purpose**: Institutional oversight and support

**Capabilities** (includes all Instructor permissions plus):
- View all courses in assigned school
- Access analytics across institution
- Monitor AI usage patterns school-wide
- Support instructors with course issues
- View aggregate student progress
- Generate institutional reports

**Limitations**:
- Cannot access courses outside their school
- Cannot modify platform settings
- Cannot create schools
- Cannot assign other School Administrators

**Assignment**: Only Global Administrators can assign this role

**Best For**:
- Department heads
- Academic technology staff
- Institutional administrators
- Curriculum coordinators

### 🛡️ Global Administrator

**Purpose**: Platform-wide administration

**Capabilities**:
- All permissions across the platform
- Create and manage schools
- Assign any role including School Administrator
- Access all courses and data
- Modify platform settings
- Manage user accounts
- View platform-wide analytics
- Data repair and maintenance tools

**Assignment**: Set at account creation or by other Global Admins

**Best For**:
- Platform administrators
- Technical support staff
- System maintainers

## How to Assign Roles

### For Instructors

1. Navigate to your course dashboard
2. Click "Students" in the course navigation
3. Find the course member you want to update
4. Click the "Edit" button next to their current role
5. Select the new role from the dropdown menu
6. Click the green checkmark to confirm

**Available role assignments for Instructors**:
- Student → Student Assistant
- Student → Teaching Assistant
- Student → Instructor (co-instructor)
- Any role back to Student

### For Global Administrators

1. Go to Admin Panel → Users tab
2. Find the user to update
3. Click "Edit User"
4. Select their global role
5. For School Administrators, also select their school
6. Save changes

**Note**: School Administrator role can only be assigned by Global Admins

### Role Change Notifications

When a role is changed:
- The user receives an email notification
- The change is logged in the system
- Permissions update immediately
- The user may need to refresh to see new features

## Common Questions

### Can someone have different roles in different courses?
Yes! A user can be a Student in one course, a Teaching Assistant in another, and an Instructor in a third. Course-specific roles override global roles within that course context.

### What happens when someone has multiple roles?
The highest role takes precedence. For example, if someone is globally an Instructor but enrolled as a Student in a specific course, they'll have Student permissions in that course.

### Can Student Assistants grade or evaluate work?
No, Student Assistants have read-only access to peer work. They can help and guide but cannot modify or formally evaluate.

### How do I request a role change?
Students should contact their instructor. For School Administrator roles, contact your institution's Global Administrator.

### Can roles be temporary?
Currently, roles persist until manually changed. Instructors should review and update roles each semester as needed.

## Troubleshooting

### "Access Denied" Errors

**For Student Assistants**:
- Ensure you're accessing projects within your enrolled courses
- Verify your enrollment is approved
- Try refreshing the page

**For Teaching Assistants**:
- Confirm your role was properly assigned
- Check that you're in the correct course
- Clear browser cache if issues persist

### "Unknown User" Display

**Issue**: Teaching Assistants seeing "Unknown User" instead of student names

**Solution**: This has been fixed in the latest update. If you still see this:
1. Log out and log back in
2. Clear browser cache
3. Contact support if the issue persists

### Missing Features After Role Assignment

1. Refresh the browser page
2. Log out and log back in
3. Check that the role was saved properly
4. Verify you're in the correct course context

### Cannot Assign Roles

**For Instructors**:
- Verify you have Instructor role in the course
- Check that the student is enrolled
- Ensure their enrollment is approved

**For School Admin Assignment**:
- Only Global Admins can assign this role
- Contact your platform administrator

## Best Practices

### For Instructors

1. **Start Simple**: Begin with basic Student/Instructor roles
2. **Add Assistants as Needed**: Promote high-performing students to Student Assistants
3. **Clear Expectations**: Communicate role responsibilities to assistants
4. **Regular Reviews**: Update roles each semester
5. **Document Changes**: Keep track of why roles were assigned

### For Teaching Assistants

1. **Respect Privacy**: Use access responsibly
2. **Support, Don't Judge**: Focus on helping students improve
3. **Communicate with Instructor**: Report issues or concerns
4. **Be Available**: Set office hours for student support
5. **Document Interactions**: Keep notes on student assistance

### For Student Assistants

1. **Lead by Example**: Maintain high-quality work
2. **Be Encouraging**: Support peer learning
3. **Ask Before Helping**: Respect peer autonomy
4. **Share Resources**: Help peers find solutions
5. **Report Issues**: Inform instructors of systemic problems

### For School Administrators

1. **Regular Monitoring**: Check course health weekly
2. **Support Instructors**: Be available for questions
3. **Identify Patterns**: Look for institution-wide trends
4. **Protect Privacy**: Access data only as needed
5. **Collaborate**: Work with instructors on improvements

## Security Considerations

- Roles are enforced at both UI and database levels
- All role changes are logged
- Email notifications ensure transparency
- Regular audits should verify appropriate access
- Report any suspected misuse immediately

## Future Enhancements

Planned improvements to the role system:
- Temporary role assignments with expiration dates
- Custom role creation for specific needs
- Bulk role assignment tools
- Role assignment templates
- Enhanced audit trails

---

**Last Updated**: January 2025
**Version**: 1.0
**Contact**: For questions about roles, contact your instructor or administrator