// Vercel Serverless Function for sending emails
// This file should be placed in /api/send-email.js

export default async function handler(req, res) {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, htmlContent, textContent } = req.body;

    // Get SendGrid configuration from environment variables
    const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';

    if (!SENDGRID_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'SendGrid API key not configured' 
      });
    }

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: subject
        }
      ],
      from: { email: SENDGRID_FROM_EMAIL, name: 'AI Engagement Hub' },
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
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('✅ Email sent successfully to:', to);
      res.json({ success: true });
    } else {
      const errorData = await response.json();
      console.error('❌ SendGrid API error:', errorData);
      res.status(500).json({ success: false, error: errorData });
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}