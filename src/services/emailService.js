// SendGrid Email Service for AI Engagement Hub
// Handles email notifications for instructor notes and project updates

const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';
const APP_URL = process.env.REACT_APP_URL || 'http://localhost:3000';

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
  }
};

// SendGrid API integration
class EmailService {
  constructor() {
    this.apiKey = SENDGRID_API_KEY;
    this.fromEmail = SENDGRID_FROM_EMAIL;
    this.baseUrl = 'https://api.sendgrid.com/v3/mail/send';
  }

  async sendEmail(to, subject, htmlContent, textContent) {
    if (!this.apiKey) {
      console.error('SendGrid API key not configured');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: { email: this.fromEmail, name: 'AI Engagement Hub' },
      content: [
        {
          type: 'text/plain',
          value: textContent
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully to:', to);
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('❌ SendGrid API error:', errorData);
        return { success: false, error: errorData };
      }
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { success: false, error: error.message };
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
}

// Create singleton instance
const emailService = new EmailService();

// Email notification functions
export const emailNotifications = {
  // Send email when instructor adds a note to student project
  async notifyStudentOfInstructorNote(noteData) {
    try {
      // Check if student has email notifications enabled
      const { userApi } = await import('./supabaseApi');
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
  }
};

export default emailService;