import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Simple test component to isolate the problem
const TestPDFUpload = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Step 1: Test with SERVICE KEY (admin client) ---
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia3B4dHJuc2VnaHpzcnZxaGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMzgyNiwiZXhwIjoyMDY3NDk5ODI2fQ.CHhOVYfTBimQtW_GZW1UVLvbmcPSoOk6GTNAV0HjLuA';
  
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const log = (message) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const runTest = async () => {
    setLoading(true);
    setResults([]);

    try {
      log('🔍 Starting SERVICE KEY Test...');
      log('🔑 Using service key (admin client) - no auth needed');
      
      // Service key bypasses all auth - no sign in needed!

      // --- Step 3: Try to select from the table ---
      log('📋 Testing table access...');
      const { data, error } = await supabase.from('pdf_attachments').select('*');

      if (error) {
        log(`❌ TABLE TEST FAILED: ${error.message} (Code: ${error.code})`);
        log('🔍 This suggests the problem is with Supabase configuration or RLS policies');
      } else {
        log(`✅ TABLE TEST SUCCEEDED! Found ${data.length} records`);
        log('🔍 This proves the table access works - the problem is in your app structure');
      }

      // --- Step 4: Try to insert a test record ---
      log('📝 Testing insert...');
      const testRecord = {
        chat_id: '00000000-0000-0000-0000-000000000001', // Fake UUID for test
        file_name: 'test.pdf',
        file_size: 1024,
        file_type: 'application/pdf',
        storage_path: 'test/path.pdf',
        extracted_text: 'Test content'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('pdf_attachments')
        .insert(testRecord)
        .select();

      if (insertError) {
        log(`❌ INSERT TEST FAILED: ${insertError.message} (Code: ${insertError.code})`);
      } else {
        log(`✅ INSERT TEST SUCCEEDED! Created record: ${insertData[0].id}`);
      }

      // --- Step 5: Check auth status ---
      const { data: { user } } = await supabase.auth.getUser();
      log(`👤 Current user: ${user ? user.email : 'Service Role (Admin)'}`);
      
      // --- Step 6: Test with explicit service role ---
      log('🔧 Testing service role access...');
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      if (roleError) {
        log(`❌ Role check failed: ${roleError.message}`);
      } else {
        log(`✅ Current role: ${roleData || 'Unknown'}`);
      }

    } catch (error) {
      log(`💥 Test failed with error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>PDF Upload Test - Isolated</h2>
      <button 
        onClick={runTest} 
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
        {loading ? 'Running Test...' : 'Run Test'}
      </button>

      <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
        <h3>Test Results:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPDFUpload;