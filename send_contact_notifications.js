// Send email notifications for new contact requests
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
// Use SendGrid API key from environment variables
const sendGridApiKey = process.env.REACT_APP_SENDGRID_API_KEY;
const fromEmail = 'sage@sagerock.com';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendContactNotifications() {
  try {
    console.log('📧 Checking for new contact requests...');

    // Get new contact requests
    const { data: requests, error } = await supabase
      .from('contact_requests')
      .select('*')
      .eq('status', 'new')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!requests || requests.length === 0) {
      console.log('✅ No new contact requests found.');
      return;
    }

    console.log(`📨 Found ${requests.length} new contact request(s). Sending notification...`);

    // Create email content
    const subject = `${requests.length} New Contact Request${requests.length > 1 ? 's' : ''} - AI Engagement Hub`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">New Contact Request${requests.length > 1 ? 's' : ''} - AI Engagement Hub</h2>
        
        ${requests.map(request => `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1e40af;">
              ${request.name} - ${request.organization}
            </h3>
            
            <div style="margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${request.email}">${request.email}</a></p>
              <p style="margin: 5px 0;"><strong>Organization:</strong> ${request.organization}</p>
              <p style="margin: 5px 0;"><strong>Role:</strong> ${request.role || 'Not specified'}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(request.created_at).toLocaleString()}</p>
            </div>
            
            ${request.message ? `
              <div style="background: white; padding: 15px; border-radius: 6px;">
                <strong>Message:</strong><br>
                <p style="margin: 10px 0 0 0; white-space: pre-line;">${request.message}</p>
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; font-size: 14px; margin-top: 30px;">
          <p style="margin: 0;"><strong>Next Steps:</strong></p>
          <ul style="margin: 10px 0 0 20px;">
            <li>Respond to each contact within 24 hours</li>
            <li>Provide personalized demo information</li>
            <li>Share implementation guidance and timeline</li>
            <li>Include pricing and privacy documentation</li>
          </ul>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;">
            To mark these as contacted, update their status in the database.
          </p>
        </div>
      </div>
    `;

    const textContent = `
New Contact Request${requests.length > 1 ? 's' : ''} - AI Engagement Hub

${requests.map(request => `
Name: ${request.name}
Email: ${request.email}
Organization: ${request.organization}
Role: ${request.role || 'Not specified'}
Submitted: ${new Date(request.created_at).toLocaleString()}

${request.message ? `Message:\n${request.message}\n` : ''}
---
`).join('\n')}

Total requests: ${requests.length}
    `;

    // Send email directly to SendGrid (using verified sender)
    const emailData = {
      personalizations: [
        {
          to: [{ email: 'sage@sagerock.com' }],
          subject: subject
        }
      ],
      from: { 
        email: 'sage@sagerock.com',  // Use the same email as both from and to
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

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('✅ Email sent successfully to sage@sagerock.com');
      
      // Mark requests as contacted
      const requestIds = requests.map(r => r.id);
      const { error: updateError } = await supabase
        .from('contact_requests')
        .update({ 
          status: 'contacted', 
          contacted_at: new Date().toISOString() 
        })
        .in('id', requestIds);

      if (updateError) {
        console.error('❌ Error updating request status:', updateError);
      } else {
        console.log(`✅ Marked ${requestIds.length} request(s) as contacted`);
      }
    } else {
      const errorData = await response.text();
      console.error('❌ SendGrid error:', errorData);
    }

  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }
}

sendContactNotifications();