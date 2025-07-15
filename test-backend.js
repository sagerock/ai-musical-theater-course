// Simple test to check if backend server is working
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('🔍 Testing backend server connection...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend health check:', healthData);
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
    }
    
    // Test email endpoint with dummy data
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email',
      htmlContent: '<h1>Test</h1>',
      textContent: 'Test'
    };
    
    const emailResponse = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (emailResponse.ok) {
      console.log('✅ Email endpoint is accessible');
    } else {
      const errorData = await emailResponse.json();
      console.log('❌ Email endpoint error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
  }
}

testBackend();