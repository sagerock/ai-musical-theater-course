// Test script to enable RLS on projects table
// Run with: node test_rls.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

// Create service client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSImplementation() {
  console.log('🔧 Starting RLS implementation test...');
  
  try {
    // Step 1: Check current RLS status on projects table
    console.log('\n📋 Step 1: Checking current RLS status...');
    const { data: tableInfo, error: tableError } = await supabase.rpc('check_rls_status', {
      table_name: 'projects'
    });
    
    if (tableError) {
      console.log('❌ Could not check RLS status (function may not exist)');
      console.log('Error:', tableError);
    } else {
      console.log('✅ Current RLS status:', tableInfo);
    }
    
    // Step 2: Try to enable RLS on projects table
    console.log('\n🔒 Step 2: Enabling RLS on projects table...');
    const { data: rlsResult, error: rlsError } = await supabase.rpc('enable_rls_on_table', {
      table_name: 'projects'
    });
    
    if (rlsError) {
      console.log('❌ Could not enable RLS via RPC, trying raw SQL...');
      
      // Try raw SQL approach
      const { data: sqlResult, error: sqlError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;'
      });
      
      if (sqlError) {
        console.log('❌ Raw SQL failed too:', sqlError);
        console.log('🔄 Trying alternative: manual SQL execution...');
        
        // Let's try to query the projects table first to see current state
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, user_id')
          .limit(5);
          
        if (projectsError) {
          console.log('❌ Cannot even read projects table:', projectsError);
        } else {
          console.log('✅ Current projects data:', projects);
          console.log('📊 Found', projects.length, 'projects');
        }
      } else {
        console.log('✅ RLS enabled via raw SQL');
      }
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Step 3: Test basic project access
    console.log('\n🧪 Step 3: Testing project access...');
    const { data: testProjects, error: accessError } = await supabase
      .from('projects')
      .select('id, title, user_id')
      .limit(3);
      
    if (accessError) {
      console.log('❌ Cannot access projects after RLS change:', accessError);
    } else {
      console.log('✅ Can still access projects:', testProjects);
    }
    
    console.log('\n🎉 RLS test completed!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testRLSImplementation()
  .then(() => {
    console.log('\n✨ Test execution finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Test failed:', error);
    process.exit(1);
  });