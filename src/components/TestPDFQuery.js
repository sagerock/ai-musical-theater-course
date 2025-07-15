import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const serviceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

const directClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export default function TestPDFQuery() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPDFQuery = async () => {
    setLoading(true);
    console.log('🧪 Testing PDF query...');
    
    try {
      // Test 1: Simple PDF attachments query
      console.log('🧪 Test 1: Simple PDF attachments query');
      const { data: attachments, error: attachError } = await directClient
        .from('pdf_attachments')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Simple query results:', { attachments, attachError });
      
      if (attachError) {
        setResult({ error: 'Simple query failed: ' + attachError.message });
        return;
      }
      
      // Test 2: Query with chat join
      console.log('🧪 Test 2: Query with chat join');
      const { data: withChats, error: chatError } = await directClient
        .from('pdf_attachments')
        .select(`
          *,
          chats!chat_id (
            id,
            prompt,
            created_at,
            user_id,
            project_id,
            course_id
          )
        `)
        .order('created_at', { ascending: false });
      
      console.log('📊 Chat join results:', { withChats, chatError });
      
      // Test 3: Filter by course
      const courseId = '76fc1874-9313-48fd-8916-4887cdb9d428';
      const courseAttachments = withChats?.filter(a => a.chats?.course_id === courseId) || [];
      
      console.log('📊 Course filter results:', courseAttachments);
      
      setResult({
        totalAttachments: attachments?.length || 0,
        withChatsCount: withChats?.length || 0,
        courseAttachmentsCount: courseAttachments.length,
        sampleAttachment: courseAttachments[0],
        chatError: chatError?.message,
        attachError: attachError?.message
      });
      
    } catch (error) {
      console.error('🧪 Test error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testPDFQuery();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">PDF Query Test</h3>
      
      <button
        onClick={testPDFQuery}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Retry Test'}
      </button>
      
      {result && (
        <div className="bg-white p-4 rounded border">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}