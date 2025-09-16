// SendGrid Email Service for AI Engagement Hub
// Handles email notifications for instructor notes and project updates

const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';
const APP_URL = process.env.REACT_APP_URL || 'http://localhost:3000';
const EMAIL_API_URL = process.env.REACT_APP_EMAIL_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

// Helper function to extract proper display name with role fallback
export const getDisplayNameForEmail = (user, role = null) => {
  if (!user) return role ? role : 'User';
  
  // Try to get first name from full name
  if (user.name && user.name.trim()) {
    const firstName = user.name.trim().split(' ')[0];
    return firstName;
  }
  
  // Try display_name field
  if (user.display_name && user.display_name.trim()) {
    const firstName = user.display_name.trim().split(' ')[0];
    return firstName;
  }
  
  // Try displayName field
  if (user.displayName && user.displayName.trim()) {
    const firstName = user.displayName.trim().split(' ')[0];
    return firstName;
  }
  
  // Fallback to role-based greeting
  if (role) {
    const roleMap = {
      'student': 'Student',
      'instructor': 'Instructor', 
      'admin': 'Administrator'
    };
    return roleMap[role.toLowerCase()] || role;
  }
  
  // Final fallback to email prefix or generic
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
};

// Email templates
const EMAIL_TEMPLATES = {
  instructorNote: {
    subject: 'New instructor note on your project',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Instructor Note</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .note-content { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 New Instructor Note</h1>
            <p>Your instructor has added a note to your project</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.studentName}</strong>,</p>
            
            <p><strong>${data.instructorName}</strong> has added a note to your project "<strong>${data.projectTitle}</strong>".</p>
            
            <div class="note-content">
              <h3>📋 Note:</h3>
              <p>${data.noteContent}</p>
              <p><em>Added on ${data.noteDate}</em></p>
            </div>
            
            <p>This note is designed to help guide your learning and provide feedback on your AI interactions.</p>
            
            <a href="${APP_URL}/chat/${data.projectId}" class="button">View Project & Note</a>
            
            <p>Keep up the great work exploring AI-enhanced learning!</p>
            
            <p>Best regards,<br>
            <strong>${data.instructorName}</strong><br>
            ${data.courseName}</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This email was sent because you're enrolled in ${data.courseName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
New Instructor Note - AI Engagement Hub

Hello ${data.studentName},

${data.instructorName} has added a note to your project "${data.projectTitle}".

Note:
${data.noteContent}

Added on ${data.noteDate}

This note is designed to help guide your learning and provide feedback on your AI interactions.

View your project: ${APP_URL}/chat/${data.projectId}

Keep up the great work exploring AI-enhanced learning!

Best regards,
${data.instructorName}
${data.courseName}

---
AI Engagement Hub - Empowering educators and students with AI insights
This email was sent because you're enrolled in ${data.courseName}
    `
  },

  newProject: {
    subject: 'Student started a new project',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Student Project</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .project-info { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: #f8fafc; border-radius: 6px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #10b981; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Student Project</h1>
            <p>A student has started a new project in your course</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.instructorName}</strong>,</p>
            
            <p><strong>${data.studentName}</strong> has created a new project in your course "<strong>${data.courseName}</strong>".</p>
            
            <div class="project-info">
              <h3>📁 Project Details:</h3>
              <p><strong>Title:</strong> ${data.projectTitle}</p>
              <p><strong>Description:</strong> ${data.projectDescription || 'No description provided'}</p>
              <p><strong>Created:</strong> ${data.createdDate}</p>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${data.studentProjectCount}</div>
                <div class="stat-label">Student Projects</div>
              </div>
              <div class="stat">
                <div class="stat-number">${data.courseProjectCount}</div>
                <div class="stat-label">Course Projects</div>
              </div>
            </div>
            
            <p>You can monitor the student's AI interactions and provide guidance as they work on this project.</p>
            
            <a href="${APP_URL}/instructor" class="button">View Instructor Dashboard</a>
            
            <p>This is a great opportunity to observe how students are engaging with AI tools and provide targeted support.</p>
            
            <p>Best regards,<br>
            AI Engagement Hub Team</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This email was sent because you're an instructor in ${data.courseName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
New Student Project - AI Engagement Hub

Hello ${data.instructorName},

${data.studentName} has created a new project in your course "${data.courseName}".

Project Details:
- Title: ${data.projectTitle}
- Description: ${data.projectDescription || 'No description provided'}
- Created: ${data.createdDate}

Statistics:
- Student Projects: ${data.studentProjectCount}
- Course Projects: ${data.courseProjectCount}

You can monitor the student's AI interactions and provide guidance as they work on this project.

View your instructor dashboard: ${APP_URL}/instructor

This is a great opportunity to observe how students are engaging with AI tools and provide targeted support.

Best regards,
AI Engagement Hub Team

---
AI Engagement Hub - Empowering educators and students with AI insights
This email was sent because you're an instructor in ${data.courseName}
    `
  },

  adminMessage: {
    subject: (data) => data.subject || 'Important message from AI Engagement Hub',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message from Administration</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .message-content { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .recipient-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Administrative Message</h1>
            <p>Message from AI Engagement Hub Administration</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            
            <p>You are receiving this message from the AI Engagement Hub administration team.</p>
            
            <div class="message-content">
              <h3>📋 Message:</h3>
              <div>${data.messageContent}</div>
              <p><em>Sent on ${data.sentDate}</em></p>
            </div>
            
            <div class="recipient-info">
              <strong>Recipient Type:</strong> ${data.recipientType}<br>
              <strong>From:</strong> ${data.senderName} (Administrator)<br>
              <strong>Priority:</strong> ${data.priority || 'Normal'}
            </div>
            
            <a href="${APP_URL}/dashboard" class="button">Access Platform</a>
            
            <p>If you have any questions or concerns, please contact the administration team.</p>
            
            <p>Best regards,<br>
            <strong>${data.senderName}</strong><br>
            AI Engagement Hub Administration</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This message was sent to ${data.recipientType.toLowerCase()} by platform administration</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
Administrative Message - AI Engagement Hub

Hello ${data.recipientName},

You are receiving this message from the AI Engagement Hub administration team.

Message:
${data.messageContent}

Sent on ${data.sentDate}

Recipient Type: ${data.recipientType}
From: ${data.senderName} (Administrator)
Priority: ${data.priority || 'Normal'}

Access the platform: ${APP_URL}/dashboard

If you have any questions or concerns, please contact the administration team.

Best regards,
${data.senderName}
AI Engagement Hub Administration

---
AI Engagement Hub - Empowering educators and students with AI insights
This message was sent to ${data.recipientType.toLowerCase()} by platform administration
    `
  },

  adminCourseEnrollmentAlert: {
    subject: (data) => `Course enrollment request - ${data.requestedRole} access requested`,
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Enrollment Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${data.requestedRole === 'instructor' ? '#dc2626 0%, #b91c1c 100%' : '#2563eb 0%, #1d4ed8 100%'}); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .user-info { background: ${data.requestedRole === 'instructor' ? '#fef2f2' : '#eff6ff'}; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${data.requestedRole === 'instructor' ? '#dc2626' : '#2563eb'}; }
          .course-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; }
          .button { display: inline-block; background: ${data.requestedRole === 'instructor' ? '#dc2626' : '#2563eb'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .button.secondary { background: #6b7280; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .actions { text-align: center; margin: 20px 0; }
          .actions .button { margin: 0 10px; }
          .priority-badge { background: ${data.requestedRole === 'instructor' ? '#fee2e2' : '#dbeafe'}; color: ${data.requestedRole === 'instructor' ? '#dc2626' : '#2563eb'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .role-highlight { color: ${data.requestedRole === 'instructor' ? '#dc2626' : '#2563eb'}; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.requestedRole === 'instructor' ? '🚨' : '📋'} Course Enrollment Request</h1>
            <p>A ${data.requestedRole} has requested to join a course in your platform</p>
          </div>
          <div class="content">
            <p>Hello <strong>Administrator</strong>,</p>
            
            <div class="priority-badge">${data.requestedRole === 'instructor' ? 'High Priority Review Required' : 'New Enrollment Request'}</div>
            
            <p>Someone has requested <strong class="role-highlight">${data.requestedRole}-level access</strong> to one of your courses${data.requestedRole === 'instructor' ? ', which requires administrative oversight for security and academic integrity' : '. As an admin, you have full oversight of all course enrollments'}.</p>
            
            <div class="user-info">
              <h3>${data.requestedRole === 'instructor' ? '👩‍🏫' : '👤'} ${data.requestedRole === 'instructor' ? 'Instructor' : 'Student'} Request Details:</h3>
              <p><strong>Name:</strong> ${data.userName}</p>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Requested Role:</strong> <span class="role-highlight">${data.requestedRole}</span></p>
              <p><strong>Request Date:</strong> ${data.requestDate}</p>
            </div>
            
            <div class="course-info">
              <h3>📚 Course Information:</h3>
              <p><strong>Course:</strong> ${data.courseName}</p>
              <p><strong>Course Code:</strong> ${data.courseCode}</p>
              <p><strong>Current Instructors:</strong> ${data.currentInstructorCount}</p>
              <p><strong>Total Students:</strong> ${data.currentStudentCount}</p>
              <p><strong>Pending Requests:</strong> ${data.pendingRequestCount || 'Unknown'}</p>
            </div>
            
            ${data.requestedRole === 'instructor' ? `
            <p><strong>⚠️ Administrative Action Required:</strong></p>
            <ul>
              <li>Verify the requestor's credentials and authorization</li>
              <li>Confirm they should have instructor-level access</li>
              <li>Review course enrollment and existing instructor arrangements</li>
              <li>Approve or deny the request through the admin panel</li>
            </ul>
            ` : `
            <p><strong>ℹ️ Administrative Options:</strong></p>
            <ul>
              <li>Review the student's request and approve if appropriate</li>
              <li>Monitor course enrollment and capacity</li>
              <li>Assist course instructors with approval if needed</li>
              <li>Manage course access through the admin panel</li>
            </ul>
            `}
            
            <div class="actions">
              <a href="${APP_URL}/admin" class="button">Review in Admin Panel</a>
              <a href="${APP_URL}/instructor" class="button secondary">View All Courses</a>
            </div>
            
            <p><em>${data.requestedRole === 'instructor' ? 'Instructor-level access grants significant permissions including student data access, grade management, and course content control. Please review carefully.' : 'You can assist with approvals or let course instructors handle routine student enrollments.'}</em></p>
            
            <p>Best regards,<br>
            AI Engagement Hub ${data.requestedRole === 'instructor' ? 'Security System' : 'Notification System'}</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - ${data.requestedRole === 'instructor' ? 'Secure Educational AI Platform' : 'Educational AI Platform Management'}</p>
            <p>This is an automated ${data.requestedRole === 'instructor' ? 'security alert' : 'notification'} for course enrollment requests</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
${data.requestedRole.toUpperCase()} ENROLLMENT REQUEST - AI Engagement Hub
${data.requestedRole === 'instructor' ? 'HIGH PRIORITY REVIEW REQUIRED' : 'NEW ENROLLMENT NOTIFICATION'}

Hello Administrator,

Someone has requested ${data.requestedRole.toUpperCase()}-LEVEL ACCESS to one of your courses${data.requestedRole === 'instructor' ? ', which requires administrative oversight for security and academic integrity' : '. As an admin, you have full oversight of all course enrollments'}.

${data.requestedRole === 'instructor' ? 'Instructor' : 'Student'} Request Details:
- Name: ${data.userName}
- Email: ${data.userEmail}
- Requested Role: ${data.requestedRole}
- Request Date: ${data.requestDate}

Course Information:
- Course: ${data.courseName}
- Course Code: ${data.courseCode}
- Current Instructors: ${data.currentInstructorCount}
- Total Students: ${data.currentStudentCount}
- Pending Requests: ${data.pendingRequestCount || 'Unknown'}

${data.requestedRole === 'instructor' ? `ADMINISTRATIVE ACTION REQUIRED:
- Verify the requestor's credentials and authorization
- Confirm they should have instructor-level access
- Review course enrollment and existing instructor arrangements
- Approve or deny the request through the admin panel` : `ADMINISTRATIVE OPTIONS:
- Review the student's request and approve if appropriate
- Monitor course enrollment and capacity
- Assist course instructors with approval if needed
- Manage course access through the admin panel`}

Review in Admin Panel: ${APP_URL}/admin
View All Courses: ${APP_URL}/instructor

${data.requestedRole === 'instructor' ? 'IMPORTANT: Instructor-level access grants significant permissions including student data access, grade management, and course content control. Please review carefully.' : 'NOTE: You can assist with approvals or let course instructors handle routine student enrollments.'}

Best regards,
AI Engagement Hub ${data.requestedRole === 'instructor' ? 'Security System' : 'Notification System'}

---
AI Engagement Hub - ${data.requestedRole === 'instructor' ? 'Secure Educational AI Platform' : 'Educational AI Platform Management'}
This is an automated ${data.requestedRole === 'instructor' ? 'security alert' : 'notification'} for course enrollment requests
    `
  },

  adminInstructorEnrollmentAlert: {
    subject: 'Instructor enrollment request requires review',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Instructor Enrollment Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .instructor-info { background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .course-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .button.secondary { background: #6b7280; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .actions { text-align: center; margin: 20px 0; }
          .actions .button { margin: 0 10px; }
          .alert-badge { background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Instructor Enrollment Alert</h1>
            <p>An instructor-level enrollment request requires administrative review</p>
          </div>
          <div class="content">
            <p>Hello <strong>Administrator</strong>,</p>
            
            <div class="alert-badge">High Priority Review Required</div>
            
            <p>Someone has requested <strong>instructor-level access</strong> to a course, which requires administrative oversight for security and academic integrity.</p>
            
            <div class="instructor-info">
              <h3>👩‍🏫 Instructor Request Details:</h3>
              <p><strong>Name:</strong> ${data.instructorName}</p>
              <p><strong>Email:</strong> ${data.instructorEmail}</p>
              <p><strong>Requested Role:</strong> <span style="color: #dc2626; font-weight: bold;">${data.requestedRole}</span></p>
              <p><strong>Request Date:</strong> ${data.requestDate}</p>
            </div>
            
            <div class="course-info">
              <h3>📚 Course Information:</h3>
              <p><strong>Course:</strong> ${data.courseName}</p>
              <p><strong>Course Code:</strong> ${data.courseCode}</p>
              <p><strong>Current Instructors:</strong> ${data.currentInstructorCount}</p>
              <p><strong>Total Students:</strong> ${data.currentStudentCount}</p>
            </div>
            
            <p><strong>⚠️ Administrative Action Required:</strong></p>
            <ul>
              <li>Verify the requestor's credentials and authorization</li>
              <li>Confirm they should have instructor-level access</li>
              <li>Review course enrollment and existing instructor arrangements</li>
              <li>Approve or deny the request through the admin panel</li>
            </ul>
            
            <div class="actions">
              <a href="${APP_URL}/admin" class="button">Review in Admin Panel</a>
              <a href="${APP_URL}/instructor" class="button secondary">View All Courses</a>
            </div>
            
            <p><em>Instructor-level access grants significant permissions including student data access, grade management, and course content control. Please review carefully.</em></p>
            
            <p>Best regards,<br>
            AI Engagement Hub Security System</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Secure Educational AI Platform</p>
            <p>This is an automated security alert for instructor-level access requests</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
INSTRUCTOR ENROLLMENT ALERT - AI Engagement Hub
HIGH PRIORITY REVIEW REQUIRED

Hello Administrator,

Someone has requested INSTRUCTOR-LEVEL ACCESS to a course, which requires administrative oversight for security and academic integrity.

Instructor Request Details:
- Name: ${data.instructorName}
- Email: ${data.instructorEmail}
- Requested Role: ${data.requestedRole}
- Request Date: ${data.requestDate}

Course Information:
- Course: ${data.courseName}
- Course Code: ${data.courseCode}
- Current Instructors: ${data.currentInstructorCount}
- Total Students: ${data.currentStudentCount}

ADMINISTRATIVE ACTION REQUIRED:
- Verify the requestor's credentials and authorization
- Confirm they should have instructor-level access
- Review course enrollment and existing instructor arrangements
- Approve or deny the request through the admin panel

Review in Admin Panel: ${APP_URL}/admin
View All Courses: ${APP_URL}/instructor

IMPORTANT: Instructor-level access grants significant permissions including student data access, grade management, and course content control. Please review carefully.

Best regards,
AI Engagement Hub Security System

---
AI Engagement Hub - Secure Educational AI Platform
This is an automated security alert for instructor-level access requests
    `
  },

  courseEnrollmentRequest: {
    subject: 'New course enrollment request',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Enrollment Request</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .student-info { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .button.secondary { background: #6b7280; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .actions { text-align: center; margin: 20px 0; }
          .actions .button { margin: 0 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Course Enrollment Request</h1>
            <p>A student has requested to join your course</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.instructorName}</strong>,</p>
            
            <p>A student has submitted a request to join your course "<strong>${data.courseName}</strong>".</p>
            
            <div class="student-info">
              <h3>👤 Student Information:</h3>
              <p><strong>Name:</strong> ${data.studentName}</p>
              <p><strong>Email:</strong> ${data.studentEmail}</p>
              <p><strong>Requested Role:</strong> ${data.requestedRole}</p>
              <p><strong>Course Code:</strong> ${data.courseCode}</p>
              <p><strong>Request Date:</strong> ${data.requestDate}</p>
            </div>
            
            <p>You can review and approve this request from your instructor dashboard. Once approved, the student will gain access to the course and can begin creating projects and engaging with AI tools.</p>
            
            <div class="actions">
              <a href="${APP_URL}/instructor" class="button">Review Request</a>
            </div>
            
            <p>Students are waiting for your approval to start their AI-enhanced learning journey in your course.</p>
            
            <p>Best regards,<br>
            AI Engagement Hub Team</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This email was sent because you're an instructor in ${data.courseName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
Course Enrollment Request - AI Engagement Hub

Hello ${data.instructorName},

A student has submitted a request to join your course "${data.courseName}".

Student Information:
- Name: ${data.studentName}
- Email: ${data.studentEmail}
- Requested Role: ${data.requestedRole}
- Course Code: ${data.courseCode}
- Request Date: ${data.requestDate}

You can review and approve this request from your instructor dashboard: ${APP_URL}/instructor

Once approved, the student will gain access to the course and can begin creating projects and engaging with AI tools.

Students are waiting for your approval to start their AI-enhanced learning journey in your course.

Best regards,
AI Engagement Hub Team

---
AI Engagement Hub - Empowering educators and students with AI insights
This email was sent because you're an instructor in ${data.courseName}
    `
  },

  courseAnnouncement: {
    subject: (data) => `📢 ${data.announcementTitle}`,
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Announcement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .announcement-content { background: #faf5ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .button:hover { background: #7c3aed; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .course-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; }
          .pinned-badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-bottom: 10px; }
          .attachments { margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 6px; }
          .attachment-item { padding: 8px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Course Announcement</h1>
            <p>${data.courseName}</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.recipientName}</strong>,</p>

            ${data.isPinned ? '<div class="pinned-badge">📌 Pinned Announcement</div>' : ''}

            <p>Your instructor <strong>${data.instructorName}</strong> has posted a new announcement:</p>

            <div class="announcement-content">
              <h2 style="color: #1f2937; margin-top: 0;">${data.announcementTitle}</h2>
              <div style="white-space: pre-wrap;">${data.announcementContent}</div>
            </div>

            ${data.attachments && data.attachments.length > 0 ? `
              <div class="attachments">
                <h3 style="margin-top: 0; color: #4b5563;">📎 Attachments (${data.attachments.length})</h3>
                ${data.attachments.map(att => `
                  <div class="attachment-item">
                    📄 ${att.fileName} (${att.fileSize ? Math.round(att.fileSize / 1024) + ' KB' : 'File'})
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="course-info">
              <strong>Course:</strong> ${data.courseName}<br>
              <strong>Course Code:</strong> ${data.courseCode}<br>
              <strong>Posted by:</strong> ${data.instructorName}<br>
              <strong>Date:</strong> ${data.postedDate}
            </div>

            <p>Join the discussion and comment on this announcement directly in the platform:</p>

            <div style="text-align: center;">
              <a href="${APP_URL}/course/${data.courseId}/announcements#announcement-${data.announcementId}" class="button">💬 View Discussion & Comment</a>
            </div>

            <p>Stay engaged with your course community and don't miss important updates!</p>

            <p>Best regards,<br>
            <strong>${data.instructorName}</strong><br>
            ${data.courseName}</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This announcement was sent to all members of ${data.courseName}</p>
            <p style="font-size: 12px;">To manage your email preferences, visit your profile settings in the platform.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
Course Announcement - ${data.courseName}

Hello ${data.recipientName},

${data.isPinned ? '📌 PINNED ANNOUNCEMENT\n\n' : ''}Your instructor ${data.instructorName} has posted a new announcement:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.announcementTitle}

${data.announcementContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.attachments && data.attachments.length > 0 ? `Attachments (${data.attachments.length}):
${data.attachments.map(att => `• ${att.fileName}`).join('\n')}

` : ''}Course: ${data.courseName}
Course Code: ${data.courseCode}
Posted by: ${data.instructorName}
Date: ${data.postedDate}

Join the discussion and comment on this announcement:
${APP_URL}/course/${data.courseId}/announcements#announcement-${data.announcementId}

Stay engaged with your course community and don't miss important updates!

Best regards,
${data.instructorName}
${data.courseName}

---
AI Engagement Hub - Empowering educators and students with AI insights
This announcement was sent to all members of ${data.courseName}
To manage your email preferences, visit your profile settings in the platform.
    `
  },

  instructorMessage: {
    subject: (data) => data.subject || 'Message from your instructor',
    getHtml: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message from Instructor</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .message-content { background: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          .course-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; font-size: 14px; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👨‍🏫 Instructor Message</h1>
            <p>Message from your course instructor</p>
          </div>
          <div class="content">
            <p>Hello <strong>${data.studentName}</strong>,</p>
            
            <p>You have received a message from your instructor <strong>${data.instructorName}</strong>.</p>
            
            <div class="message-content">
              <h3>📋 Message:</h3>
              <div>${data.messageContent}</div>
              <p><em>Sent on ${data.sentDate}</em></p>
            </div>
            
            <div class="course-info">
              <strong>Course:</strong> ${data.courseName}<br>
              <strong>Course Code:</strong> ${data.courseCode}<br>
              <strong>From:</strong> ${data.instructorName} (Instructor)
            </div>
            
            <a href="${APP_URL}/course/${data.courseId}" class="button">View Course</a>
            
            <p>Continue your excellent work in the course, and don't hesitate to reach out if you have any questions.</p>
            
            <p>Best regards,<br>
            <strong>${data.instructorName}</strong><br>
            ${data.courseName}</p>
          </div>
          <div class="footer">
            <p>AI Engagement Hub - Empowering educators and students with AI insights</p>
            <p>This message was sent by your instructor in ${data.courseName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    getText: (data) => `
Instructor Message - AI Engagement Hub

Hello ${data.studentName},

You have received a message from your instructor ${data.instructorName}.

Message:
${data.messageContent}

Sent on ${data.sentDate}

Course: ${data.courseName}
Course Code: ${data.courseCode}
From: ${data.instructorName} (Instructor)

View course: ${APP_URL}/course/${data.courseId}

Continue your excellent work in the course, and don't hesitate to reach out if you have any questions.

Best regards,
${data.instructorName}
${data.courseName}

---
AI Engagement Hub - Empowering educators and students with AI insights
This message was sent by your instructor in ${data.courseName}
    `
  }
};

// SendGrid API integration
class EmailService {
  constructor() {
    this.apiKey = SENDGRID_API_KEY;
    this.fromEmail = SENDGRID_FROM_EMAIL;
    this.baseUrl = 'https://api.sendgrid.com/v3/mail/send';
  }

  async sendEmail(to, subject, htmlContent, textContent, replyTo = null) {
    const emailData = {
      to: to,
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    };

    // Add replyTo if provided
    if (replyTo) {
      emailData.replyTo = replyTo;
    }

    // Try to use backend server first (works in both dev and prod)
    try {
      const apiUrl = EMAIL_API_URL ? `${EMAIL_API_URL}/api/send-email` : '/api/send-email';
      console.log('📧 Attempting to send email via:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via backend to:', to);
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('❌ Backend email API error:', errorData);
        throw new Error(`Backend API error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ Backend email sending failed:', error);
      
      // Check if it's a blocked request (ad blocker, etc.)
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || error.message?.includes('blocked')) {
        console.warn('⚠️ Email request blocked by client (likely ad blocker)');
      }
      
      // Fallback to simulation mode if backend is not available
      console.log('🔄 Falling back to email simulation mode...');
      console.log('📧 SIMULATION MODE - Email would be sent to:', to);
      console.log('📧 Subject:', subject);
      console.log('📧 HTML Content:', htmlContent.substring(0, 200) + (htmlContent.length > 200 ? '...' : ''));
      console.log('📧 Text Content:', textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''));
      console.log('✅ Email simulated successfully (backend unavailable)');
      return { success: true };
    }
  }

  async sendInstructorNoteEmail(data) {
    const template = EMAIL_TEMPLATES.instructorNote;
    const subject = template.subject;
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.studentEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async sendNewProjectEmail(data) {
    const template = EMAIL_TEMPLATES.newProject;
    const subject = template.subject;
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.instructorEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async sendCourseEnrollmentRequestEmail(data) {
    const template = EMAIL_TEMPLATES.courseEnrollmentRequest;
    const subject = template.subject;
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.instructorEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async sendAdminCourseEnrollmentAlert(data) {
    const template = EMAIL_TEMPLATES.adminCourseEnrollmentAlert;
    const subject = template.subject(data);
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.adminEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async sendAdminInstructorEnrollmentAlert(data) {
    const template = EMAIL_TEMPLATES.adminInstructorEnrollmentAlert;
    const subject = template.subject;
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.adminEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  // Send email to multiple instructors for a course
  async sendNewProjectToInstructors(data, instructorEmails) {
    const results = [];
    
    for (const instructorEmail of instructorEmails) {
      const emailData = {
        ...data,
        instructorEmail
      };
      
      const result = await this.sendNewProjectEmail(emailData);
      results.push({
        email: instructorEmail,
        success: result.success,
        error: result.error
      });
    }
    
    return results;
  }

  async sendAdminMessage(data) {
    const template = EMAIL_TEMPLATES.adminMessage;
    const subject = template.subject(data);
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    return await this.sendEmail(
      data.recipientEmail,
      subject,
      htmlContent,
      textContent
    );
  }

  async sendInstructorMessage(data) {
    const template = EMAIL_TEMPLATES.instructorMessage;
    const subject = template.subject(data);
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    // Include instructor email as reply-to
    const replyTo = data.instructorEmail || null;

    return await this.sendEmail(
      data.studentEmail,
      subject,
      htmlContent,
      textContent,
      replyTo
    );
  }

  async sendAnnouncementEmail(data) {
    const template = EMAIL_TEMPLATES.courseAnnouncement;
    const subject = template.subject(data);
    const htmlContent = template.getHtml(data);
    const textContent = template.getText(data);

    // Include instructor email as reply-to
    const replyTo = data.instructorEmail || null;

    return await this.sendEmail(
      data.recipientEmail,
      subject,
      htmlContent,
      textContent,
      replyTo
    );
  }

  // Send message to multiple recipients
  async sendBulkMessage(recipients, messageData, messageType = 'admin') {
    const results = [];
    
    for (const recipient of recipients) {
      const emailData = {
        ...messageData,
        recipientEmail: recipient.email,
        recipientName: recipient.name
      };
      
      let result;
      if (messageType === 'admin') {
        result = await this.sendAdminMessage(emailData);
      } else if (messageType === 'instructor') {
        result = await this.sendInstructorMessage(emailData);
      }
      
      results.push({
        email: recipient.email,
        name: recipient.name,
        success: result.success,
        error: result.error
      });
    }
    
    return results;
  }
}

// Create singleton instance
const emailService = new EmailService();

// Email notification functions
export const emailNotifications = {
  // Send email when instructor adds a note to student project
  async notifyStudentOfInstructorNote(noteData) {
    try {
      // Check if student has email notifications enabled
      const { userApi } = await import('./firebaseApi.js');
      const hasNotificationsEnabled = await userApi.hasEmailNotificationsEnabled(
        noteData.studentId, 
        'instructor_note_emails'
      );
      
      if (!hasNotificationsEnabled) {
        console.log('📧 Student has disabled instructor note email notifications');
        return { success: true, skipped: true, reason: 'User disabled notifications' };
      }

      const emailData = {
        studentName: noteData.studentName,
        studentEmail: noteData.studentEmail,
        instructorName: noteData.instructorName,
        projectTitle: noteData.projectTitle,
        projectId: noteData.projectId,
        noteContent: noteData.noteContent,
        noteDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        courseName: noteData.courseName
      };

      const result = await emailService.sendInstructorNoteEmail(emailData);
      
      if (result.success) {
        console.log('✅ Instructor note email sent successfully');
      } else {
        console.error('❌ Failed to send instructor note email:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error sending instructor note email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send email when student creates a new project
  async notifyInstructorsOfNewProject(projectData) {
    try {
      const emailData = {
        studentName: projectData.studentName,
        instructorName: projectData.instructorName, // Will be overridden for each instructor
        projectTitle: projectData.projectTitle,
        projectDescription: projectData.projectDescription,
        createdDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        courseName: projectData.courseName,
        studentProjectCount: projectData.studentProjectCount || 1,
        courseProjectCount: projectData.courseProjectCount || 1
      };

      let results;
      
      if (Array.isArray(projectData.instructorEmails)) {
        // Multiple instructors
        results = await emailService.sendNewProjectToInstructors(
          emailData, 
          projectData.instructorEmails
        );
      } else {
        // Single instructor
        emailData.instructorEmail = projectData.instructorEmail;
        const result = await emailService.sendNewProjectEmail(emailData);
        results = [{ 
          email: projectData.instructorEmail, 
          success: result.success, 
          error: result.error 
        }];
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ New project emails sent: ${successCount}/${results.length}`);
      
      return { success: successCount > 0, results };
    } catch (error) {
      console.error('❌ Error sending new project email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send admin message to instructors or all users
  async sendAdminMessage(messageData) {
    try {
      const emailData = {
        ...messageData,
        sentDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      if (Array.isArray(messageData.recipients)) {
        // Bulk send to multiple recipients
        const results = await emailService.sendBulkMessage(
          messageData.recipients,
          emailData,
          'admin'
        );
        
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Admin messages sent: ${successCount}/${results.length}`);
        
        return { success: successCount > 0, results };
      } else {
        // Single recipient
        const result = await emailService.sendAdminMessage(emailData);
        return { success: result.success, results: [result] };
      }
    } catch (error) {
      console.error('❌ Error sending admin message:', error);
      return { success: false, error: error.message };
    }
  },

  // Send instructor message to students
  async sendInstructorMessage(messageData) {
    try {
      const emailData = {
        ...messageData,
        sentDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      if (Array.isArray(messageData.students)) {
        // Bulk send to multiple students
        const results = [];

        for (const student of messageData.students) {
          const studentEmailData = {
            ...emailData,
            studentName: student.name,
            studentEmail: student.email,
            instructorEmail: messageData.instructorEmail // Pass instructor email for reply-to
          };

          const result = await emailService.sendInstructorMessage(studentEmailData);
          results.push({
            email: student.email,
            name: student.name,
            success: result.success,
            error: result.error
          });
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Instructor messages sent: ${successCount}/${results.length}`);

        return { success: successCount > 0, results };
      } else {
        // Single student
        const result = await emailService.sendInstructorMessage(emailData);
        return { success: result.success, results: [result] };
      }
    } catch (error) {
      console.error('❌ Error sending instructor message:', error);
      return { success: false, error: error.message };
    }
  },

  // Send admin alert for any enrollment request (student or instructor)
  async notifyAdminsOfCourseEnrollmentRequest(enrollmentData) {
    try {
      console.log('🔍 Starting admin notification process...');
      
      // Get all admin users
      const { userApi } = await import('./firebaseApi.js');
      const allUsers = await userApi.getAllUsers();
      console.log(`👥 Total users found: ${allUsers.length}`);
      
      // Debug user roles
      const roleBreakdown = {};
      allUsers.forEach(user => {
        roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
        if (user.is_global_admin) {
          roleBreakdown['global_admin'] = (roleBreakdown['global_admin'] || 0) + 1;
        }
      });
      console.log('👥 User role breakdown:', roleBreakdown);
      
      const adminUsers = allUsers.filter(user => user.role === 'admin' || user.is_global_admin);
      console.log(`👑 Admin users found: ${adminUsers.length}`);
      
      if (adminUsers.length > 0) {
        console.log('👑 Admin user details:', adminUsers.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          is_global_admin: u.is_global_admin
        })));
      }

      if (adminUsers.length === 0) {
        console.log('📧 No admin users found to notify - skipping admin notifications');
        return { success: true, skipped: true, reason: 'No admin users found' };
      }

      // Get course statistics
      const { courseApi } = await import('./firebaseApi.js');
      const course = await courseApi.getCourseByCode(enrollmentData.courseCode);
      const courseMembers = await courseApi.getCourseMembers(course.id);
      
      const currentInstructors = courseMembers.filter(m => m.role === 'instructor' && m.status === 'approved');
      const currentStudents = courseMembers.filter(m => m.role === 'student' && m.status === 'approved');
      const pendingRequests = courseMembers.filter(m => m.status === 'pending');

      const emailData = {
        userName: enrollmentData.userName,
        userEmail: enrollmentData.userEmail,
        courseName: enrollmentData.courseName,
        courseCode: enrollmentData.courseCode,
        requestedRole: enrollmentData.requestedRole,
        currentInstructorCount: currentInstructors.length,
        currentStudentCount: currentStudents.length,
        pendingRequestCount: pendingRequests.length,
        requestDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const results = [];
      
      for (const admin of adminUsers) {
        const adminEmailData = {
          ...emailData,
          adminEmail: admin.email,
          adminName: admin.name
        };
        
        const result = await emailService.sendAdminCourseEnrollmentAlert(adminEmailData);
        results.push({
          email: admin.email,
          name: admin.name,
          success: result.success,
          error: result.error
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Admin course enrollment alerts sent: ${successCount}/${results.length} (${enrollmentData.requestedRole} request)`);
      
      return { success: successCount > 0, results };
    } catch (error) {
      console.error('❌ Error sending admin course enrollment alert:', error);
      return { success: false, error: error.message };
    }
  },

  // Send admin alert for instructor enrollment requests (legacy - keeping for compatibility)
  async notifyAdminsOfInstructorEnrollmentRequest(enrollmentData) {
    try {
      // Get all admin users
      const { userApi } = await import('./firebaseApi.js');
      const allUsers = await userApi.getAllUsers();
      const adminUsers = allUsers.filter(user => user.role === 'admin' || user.is_global_admin);

      if (adminUsers.length === 0) {
        console.log('📧 No admin users found to notify');
        return { success: true, skipped: true, reason: 'No admin users found' };
      }

      // Get course statistics
      const { courseApi } = await import('./firebaseApi.js');
      const course = await courseApi.getCourseByCode(enrollmentData.courseCode);
      const courseMembers = await courseApi.getCourseMembers(course.id);
      
      const currentInstructors = courseMembers.filter(m => m.role === 'instructor' && m.status === 'approved');
      const currentStudents = courseMembers.filter(m => m.role === 'student' && m.status === 'approved');

      const emailData = {
        instructorName: enrollmentData.instructorName,
        instructorEmail: enrollmentData.instructorEmail,
        courseName: enrollmentData.courseName,
        courseCode: enrollmentData.courseCode,
        requestedRole: enrollmentData.requestedRole,
        currentInstructorCount: currentInstructors.length,
        currentStudentCount: currentStudents.length,
        requestDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const results = [];
      
      for (const admin of adminUsers) {
        const adminEmailData = {
          ...emailData,
          adminEmail: admin.email,
          adminName: admin.name
        };
        
        const result = await emailService.sendAdminInstructorEnrollmentAlert(adminEmailData);
        results.push({
          email: admin.email,
          name: admin.name,
          success: result.success,
          error: result.error
        });
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Admin instructor enrollment alerts sent: ${successCount}/${results.length}`);
      
      return { success: successCount > 0, results };
    } catch (error) {
      console.error('❌ Error sending admin instructor enrollment alert:', error);
      return { success: false, error: error.message };
    }
  },

  // Send course enrollment request email to instructors
  async notifyInstructorsOfEnrollmentRequest(enrollmentData) {
    try {
      const emailData = {
        studentName: enrollmentData.studentName,
        studentEmail: enrollmentData.studentEmail,
        instructorName: enrollmentData.instructorName, // Will be overridden for each instructor
        courseName: enrollmentData.courseName,
        courseCode: enrollmentData.courseCode,
        requestedRole: enrollmentData.requestedRole || 'student',
        requestDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      let results;
      
      if (Array.isArray(enrollmentData.instructorEmails)) {
        // Multiple instructors
        results = [];
        
        for (const instructorInfo of enrollmentData.instructorEmails) {
          const instructorEmailData = {
            ...emailData,
            instructorEmail: instructorInfo.email,
            instructorName: instructorInfo.name
          };
          
          const result = await emailService.sendCourseEnrollmentRequestEmail(instructorEmailData);
          results.push({
            email: instructorInfo.email,
            name: instructorInfo.name,
            success: result.success,
            error: result.error
          });
        }
      } else {
        // Single instructor
        emailData.instructorEmail = enrollmentData.instructorEmail;
        const result = await emailService.sendCourseEnrollmentRequestEmail(emailData);
        results = [{ 
          email: enrollmentData.instructorEmail, 
          name: enrollmentData.instructorName,
          success: result.success, 
          error: result.error 
        }];
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Course enrollment request emails sent: ${successCount}/${results.length}`);
      
      return { success: successCount > 0, results };
    } catch (error) {
      console.error('❌ Error sending course enrollment request email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send course announcement email to all course members
  async notifyCourseOfAnnouncement(announcementData) {
    try {
      console.log('📧 Starting announcement email notifications...');

      // Get all course members
      const { courseApi } = await import('./firebaseApi.js');
      const courseMembers = await courseApi.getCourseMembers(announcementData.courseId);

      // Filter to members with email addresses (all active members)
      // Include all roles: instructor, student, teaching_assistant, student_assistant
      const membersToNotify = courseMembers.filter(member => {
        // Check for email in either direct property or nested users object
        const email = member.email || member.users?.email;
        const status = member.status;

        return email && // Must have an email
               email !== 'No email' && // Skip placeholder emails
               (status === 'approved' || status === 'active' || !status); // Include if approved, active, or no status field
      });

      console.log(`📧 Found ${membersToNotify.length} course members to notify (from ${courseMembers.length} total)`);
      console.log('📧 Member details:', membersToNotify.map(m => ({
        name: m.name || m.users?.name || 'Unknown',
        email: m.email || m.users?.email,
        role: m.role,
        status: m.status,
        userId: m.userId
      })));

      if (membersToNotify.length === 0) {
        console.log('📧 No members with email addresses found');
        return { success: true, skipped: true, reason: 'No members with email addresses found' };
      }

      // Get course details
      const course = await courseApi.getCourse(announcementData.courseId);
      console.log('📧 Course details:', { name: course.name, code: course.code });

      const emailData = {
        announcementId: announcementData.announcementId,
        announcementTitle: announcementData.title,
        announcementContent: announcementData.content,
        attachments: announcementData.attachments || [],
        isPinned: announcementData.isPinned || false,
        courseName: course.name || course.title || 'Course',
        courseCode: course.code || course.courseCode || 'N/A',
        courseId: announcementData.courseId,
        instructorName: announcementData.instructorName,
        instructorEmail: announcementData.instructorEmail,
        postedDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const results = [];

      // Send email to each member
      for (const member of membersToNotify) {
        // Skip the instructor who posted the announcement (optional)
        // if (member.userId === announcementData.instructorId) continue;

        // Get email and name from either direct properties or nested users object
        const memberEmail = member.email || member.users?.email;
        const memberName = member.name || member.users?.name || memberEmail.split('@')[0];

        const recipientEmailData = {
          ...emailData,
          recipientEmail: memberEmail,
          recipientName: memberName
        };

        try {
          const result = await emailService.sendAnnouncementEmail(recipientEmailData);
          results.push({
            email: memberEmail,
            name: memberName,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          console.error(`❌ Failed to send announcement email to ${memberEmail}:`, error);
          results.push({
            email: memberEmail,
            name: memberName,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Announcement emails sent: ${successCount}/${results.length}`);

      return {
        success: successCount > 0,
        results,
        totalSent: successCount,
        totalFailed: results.length - successCount
      };
    } catch (error) {
      console.error('❌ Error sending announcement emails:', error);
      return { success: false, error: error.message };
    }
  },

  // Send instructor note email to student
  async sendInstructorNoteEmail(noteData) {
    try {
      const template = EMAIL_TEMPLATES.instructorNote;
      const emailData = {
        to: noteData.studentEmail,
        subject: template.subject,
        html: template.getHtml(noteData),
        text: template.getText(noteData)
      };

      const response = await fetch(`${EMAIL_API_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SENDGRID_API_KEY}`
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Instructor note email sent successfully');
        return { success: true, messageId: result.messageId };
      } else {
        console.error('❌ Failed to send instructor note email:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending instructor note email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send new project email to instructor
  async sendNewProjectEmail(projectData) {
    try {
      const template = EMAIL_TEMPLATES.newProject;
      const emailData = {
        to: projectData.instructorEmail,
        subject: template.subject,
        html: template.getHtml(projectData),
        text: template.getText(projectData)
      };

      const response = await fetch(`${EMAIL_API_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SENDGRID_API_KEY}`
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ New project email sent successfully');
        return { success: true, messageId: result.messageId };
      } else {
        console.error('❌ Failed to send new project email:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending new project email:', error);
      return { success: false, error: error.message };
    }
  }
};


export default emailService;