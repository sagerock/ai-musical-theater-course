// Quick test to verify SendGrid email sending
const fetch = require('node-fetch');

async function testEmail() {
  const testEmailData = {
    to: 'sage@sagerock.com', // Sending to the same address configured as sender
    subject: '✅ AI Engagement Hub - Email Test',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1>🎉 Email System Test</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Great News!</h2>
          <p>Your AI Engagement Hub email system is working perfectly!</p>
          <ul>
            <li>✅ SendGrid API Key configured</li>
            <li>✅ From email address set to sage@sagerock.com</li>
            <li>✅ Server running on port 3001</li>
            <li>✅ Email templates ready</li>
          </ul>
          <p>The instructor messaging system is now fully operational.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Sent from AI Engagement Hub Email System
          </p>
        </div>
      </div>
    `,
    textContent: `
AI Engagement Hub Email System Test

Great News! Your email system is working perfectly!

- SendGrid API Key configured
- From email address set to sage@sagerock.com  
- Server running on port 3001
- Email templates ready

The instructor messaging system is now fully operational.

Sent from AI Engagement Hub Email System
    `
  };

  try {
    console.log('🚀 Sending test email...');
    
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmailData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS: Test email sent successfully!');
      console.log('📧 Check your inbox at sage@sagerock.com');
      console.log('📊 SendGrid Activity Feed: https://app.sendgrid.com/email_activity');
    } else {
      console.error('❌ FAILED: Email sending failed');
      console.error('Error details:', result.error);
    }
  } catch (error) {
    console.error('❌ NETWORK ERROR: Failed to connect to email server');
    console.error('Make sure the server is running on port 3001');
    console.error('Error:', error.message);
  }
}

testEmail();