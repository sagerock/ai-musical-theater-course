// Check the actual schema of tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchemas() {
  console.log('📋 Checking table schemas...');
  
  try {
    // Check projects table structure
    console.log('\n🗂️  Projects table:');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError) {
      console.log('❌ Cannot read projects table:', projectsError);
    } else {
      console.log('✅ Projects sample data:', projects[0]);
      if (projects[0]) {
        console.log('📊 Projects columns:', Object.keys(projects[0]));
      }
    }
    
    // Check chats table structure
    console.log('\n💬 Chats table:');
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .limit(1);
      
    if (chatsError) {
      console.log('❌ Cannot read chats table:', chatsError);
    } else {
      console.log('✅ Chats sample data:', chats[0]);
      if (chats[0]) {
        console.log('📊 Chats columns:', Object.keys(chats[0]));
      }
    }
    
    // Check users table structure
    console.log('\n👥 Users table:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (usersError) {
      console.log('❌ Cannot read users table:', usersError);
    } else {
      console.log('✅ Users sample data:', users[0]);
      if (users[0]) {
        console.log('📊 Users columns:', Object.keys(users[0]));
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkTableSchemas()
  .then(() => {
    console.log('\n✨ Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Schema check failed:', error);
    process.exit(1);
  });