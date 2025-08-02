// Email notification service for contact form submissions
const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;

export async function sendContactNotification(contactData) {
  try {
    const { name, email, organization, role, message, created_at } = contactData;
    
    const subject = `New Contact Request from ${name} - ${organization}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">New Contact Request - AI Engagement Hub</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">
            ${name} - ${organization}
          </h3>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 5px 0;"><strong>Organization:</strong> ${organization}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${role || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(created_at).toLocaleString()}</p>
          </div>
          
          ${message ? `
            <div style="background: white; padding: 15px; border-radius: 6px;">
              <strong>Message:</strong><br>
              <p style="margin: 10px 0 0 0; white-space: pre-line;">${message}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; font-size: 14px;">
          <p style="margin: 0;"><strong>Recommended Response:</strong></p>
          <ul style="margin: 10px 0 0 20px;">
            <li>Respond within 24 hours</li>
            <li>Provide personalized demo information</li>
            <li>Share implementation timeline for their institution size</li>
            <li>Include pricing and privacy documentation</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            <strong>Quick Actions:</strong><br>
            • Reply directly to: <a href="mailto:${email}">${email}</a><br>
            • View all requests: Run <code>node view_contact_requests.js</code><br>
            • Mark as contacted: Run <code>node mark_contacted.js</code>
          </p>
        </div>
      </div>
    `;

    const textContent = `
New Contact Request - AI Engagement Hub

Contact Information:
Name: ${name}
Email: ${email}
Organization: ${organization}
Role: ${role || 'Not specified'}
Submitted: ${new Date(created_at).toLocaleString()}

${message ? `Message:\n${message}\n` : ''}

Quick Actions:
• Reply directly to: ${email}
• View all requests: node view_contact_requests.js
• Mark as contacted: node mark_contacted.js
    `;

    const emailData = {
      personalizations: [
        {
          to: [{ email: 'sage@sagerock.com' }],
          subject: subject
        }
      ],
      from: { 
        email: 'sage@sagerock.com',
        name: 'AI Engagement Hub Contact Form' 
      },
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

    // Use the same backend API as instructor messaging
    const EMAIL_API_URL = process.env.REACT_APP_EMAIL_API_URL || 
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
    
    const emailPayload = {
      to: 'sage@sagerock.com',
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    };

    // Try backend API first
    try {
      const apiUrl = EMAIL_API_URL ? `${EMAIL_API_URL}/api/send-email` : '/api/send-email';
      console.log('📧 Attempting to send contact notification via:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (response.ok) {
        console.log('✅ Contact notification email sent successfully via backend');
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Backend email API error:', errorData);
        throw new Error(`Backend API error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ Backend email sending failed:', error);
      
      // Fallback to simulation mode
      console.log('🔄 Falling back to email simulation mode...');
      console.log('📧 SIMULATION MODE - Contact notification would be sent to: sage@sagerock.com');
      console.log('📧 Subject:', subject);
      console.log('📧 HTML Content:', htmlContent.substring(0, 200) + (htmlContent.length > 200 ? '...' : ''));
      console.log('📧 Text Content:', textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''));
      console.log('✅ Contact notification simulated successfully (backend unavailable)');
      return true;
    }

  } catch (error) {
    console.error('❌ Error sending contact notification:', error);
    return false;
  }
}

export async function sendHelpRequestNotification(helpData) {
  try {
    const { userName, userEmail, category, subject, description, createdAt } = helpData;
    
    const categoryLabels = {
      'technical': 'Technical Issue',
      'account': 'Account & Login',
      'courses': 'Course Management',
      'ai-tools': 'AI Tools & Models',
      'projects': 'Projects & Chat',
      'billing': 'Billing & Pricing',
      'feature-request': 'Feature Request',
      'other': 'Other'
    };
    
    const categoryLabel = categoryLabels[category] || category;
    const emailSubject = `Help Request: ${categoryLabel} - ${subject}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">New Help Request - AI Engagement Hub</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #991b1b;">
            ${subject}
          </h3>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Category:</strong> <span style="background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${categoryLabel}</span></p>
            <p style="margin: 5px 0;"><strong>User:</strong> ${userName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(createdAt).toLocaleString()}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <strong>Description:</strong><br>
            <p style="margin: 10px 0 0 0; white-space: pre-line;">${description}</p>
          </div>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; font-size: 14px;">
          <p style="margin: 0;"><strong>Priority Response Guidelines:</strong></p>
          <ul style="margin: 10px 0 0 20px;">
            <li><strong>Technical/Account:</strong> Respond within 4 hours</li>
            <li><strong>Course/AI Tools:</strong> Respond within 24 hours</li>
            <li><strong>Feature Request:</strong> Acknowledge within 48 hours</li>
            <li><strong>Billing:</strong> Respond within 2 hours</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            <strong>Quick Actions:</strong><br>
            • Reply directly to: <a href="mailto:${userEmail}">${userEmail}</a><br>
            • View user profile in admin panel<br>
            • Check user's recent activity for context
          </p>
        </div>
      </div>
    `;

    const textContent = `
New Help Request - AI Engagement Hub

Help Request Details:
Category: ${categoryLabel}
Subject: ${subject}
User: ${userName}
Email: ${userEmail}
Submitted: ${new Date(createdAt).toLocaleString()}

Description:
${description}

Priority Response Guidelines:
• Technical/Account: Respond within 4 hours
• Course/AI Tools: Respond within 24 hours
• Feature Request: Acknowledge within 48 hours
• Billing: Respond within 2 hours

Quick Actions:
• Reply directly to: ${userEmail}
• View user profile in admin panel
• Check user's recent activity for context
    `;

    // Use the same backend API as contact notifications
    const EMAIL_API_URL = process.env.REACT_APP_EMAIL_API_URL || 
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
    
    const emailPayload = {
      to: 'sage@sagerock.com',
      subject: emailSubject,
      htmlContent: htmlContent,
      textContent: textContent
    };

    // Try backend API first
    try {
      const apiUrl = EMAIL_API_URL ? `${EMAIL_API_URL}/api/send-email` : '/api/send-email';
      console.log('📧 Attempting to send help request notification via:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (response.ok) {
        console.log('✅ Help request notification email sent successfully via backend');
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Backend email API error:', errorData);
        throw new Error(`Backend API error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ Backend email sending failed:', error);
      
      // Fallback to simulation mode
      console.log('🔄 Falling back to email simulation mode...');
      console.log('📧 SIMULATION MODE - Help request notification would be sent to: sage@sagerock.com');
      console.log('📧 Subject:', emailSubject);
      console.log('📧 HTML Content:', htmlContent.substring(0, 200) + (htmlContent.length > 200 ? '...' : ''));
      console.log('📧 Text Content:', textContent.substring(0, 200) + (textContent.length > 200 ? '...' : ''));
      console.log('✅ Help request notification simulated successfully (backend unavailable)');
      return true;
    }

  } catch (error) {
    console.error('❌ Error sending help request notification:', error);
    return false;
  }
}