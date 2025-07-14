import React, { useState } from 'react';

// Test direct API calls to Supabase to bypass client issues
const TestDirectQuery = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const log = (message) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setResults([]);

    try {
      log('🔍 Testing direct API calls to Supabase...');
      
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      
      // Test both key formats
      const keysToTest = [
        { name: 'New Secret Key', key: 'sb_secret_a1oTyHrh1-P3fDz8jNt5Xw_xuVnSGxr' },
        { name: 'Current Service Key', key: process.env.REACT_APP_SUPABASE_SERVICE_KEY }
      ];
      
      for (const { name, key } of keysToTest) {
        log(`\n🔑 Testing ${name}...`);
        
        // Decode JWT if it's a JWT token
        if (key.startsWith('eyJ')) {
          try {
            const base64Url = key.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            log(`🔍 JWT Payload: ${JSON.stringify(payload, null, 2)}`);
            
            if (!payload.sub) {
              log('❌ Missing sub claim in JWT!');
            } else {
              log(`✅ Found sub claim: ${payload.sub}`);
            }
          } catch (e) {
            log(`❌ Failed to decode JWT: ${e.message}`);
          }
        } else {
          log(`🔍 Using non-JWT key format: ${key.substring(0, 20)}...`);
        }
        
        // Test API calls with this key
        log(`📡 Testing REST API call with ${name}...`);
        const response = await fetch(`${supabaseUrl}/rest/v1/pdf_attachments?select=*`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'apikey': key
          }
        });
        
        log(`📊 Response status: ${response.status}`);
        log(`📊 Response statusText: ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          log(`✅ REST API SUCCESS with ${name}: Found ${data.length} records`);
          break; // Stop testing if we found a working key
        } else {
          const errorText = await response.text();
          log(`❌ REST API FAILED with ${name}: ${response.status} ${response.statusText}`);
          log(`❌ Error: ${errorText}`);
        }
      }
      
    } catch (error) {
      log(`💥 Test failed with error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Direct API Test - Multiple Keys</h2>
      <button 
        onClick={testDirectAPI} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Both Keys'}
      </button>

      <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
        <h3>Results:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestDirectQuery;