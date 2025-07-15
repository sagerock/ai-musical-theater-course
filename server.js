const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Check:');
console.log('- SENDGRID_API_KEY:', process.env.REACT_APP_SENDGRID_API_KEY ? 'Set' : 'Not set');
console.log('- SENDGRID_FROM_EMAIL:', process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'Not set');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SendGrid configuration
const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@aiengagementhub.com';

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, htmlContent, textContent } = req.body;

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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to check SendGrid configuration
app.get('/api/test-config', (req, res) => {
  res.json({
    hasApiKey: !!SENDGRID_API_KEY,
    fromEmail: SENDGRID_FROM_EMAIL,
    apiKeyStart: SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'Not configured'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Email proxy server running on port ${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`📧 Email endpoint available at: http://localhost:${PORT}/api/send-email`);
});