// Test script to enable RLS on projects table with correct schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create service client for admin operations
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Create anon client to test user-level access
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function enableProjectsRLS() {
  console.log('🔧 Enabling RLS on projects table...');
  
  try {
    // First, check current projects data
    console.log('\n📊 Step 1: Current projects data');
    const { data: currentProjects, error: currentError } = await supabaseService
      .from('projects')
      .select('id, title, created_by')
      .limit(5);
      
    if (currentError) {
      console.log('❌ Cannot read current projects:', currentError);
      return;
    } else {
      console.log('✅ Current projects:', currentProjects);
      console.log(`📈 Found ${currentProjects.length} projects`);
    }
    
    // Step 2: Enable RLS using direct query execution
    console.log('\n🔒 Step 2: Enabling RLS on projects table...');
    
    // Since we can't execute raw SQL directly, I'll manually make the changes
    console.log('⚠️  Manual step required: Execute the SQL commands in enable_projects_rls_correct.sql');
    console.log('   You can do this through Supabase Dashboard > SQL Editor');
    
    // Step 3: Test project access with service key (should still work)
    console.log('\n🧪 Step 3: Testing project access with service key...');
    const { data: serviceProjects, error: serviceError } = await supabaseService
      .from('projects')
      .select('id, title, created_by');
      
    if (serviceError) {
      console.log('❌ Service key access failed:', serviceError);
    } else {
      console.log('✅ Service key can still access projects:', serviceProjects.length, 'projects found');
    }
    
    // Step 4: Test anonymous access (should be restricted after RLS)
    console.log('\n🔓 Step 4: Testing anonymous access (should be restricted)...');
    const { data: anonProjects, error: anonError } = await supabaseAnon
      .from('projects')
      .select('id, title, created_by');
      
    if (anonError) {
      console.log('✅ Anonymous access properly restricted:', anonError.message);
    } else {
      console.log('⚠️  Anonymous access still works:', anonProjects.length, 'projects - RLS may not be enabled yet');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Execute the SQL in enable_projects_rls_correct.sql via Supabase Dashboard');
    console.log('2. Test with authenticated user sessions');
    console.log('3. Verify RLS policies are working correctly');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

enableProjectsRLS()
  .then(() => {
    console.log('\n✨ RLS enablement test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Test failed:', error);
    process.exit(1);
  });