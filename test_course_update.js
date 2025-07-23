// Test course update directly
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCourseUpdate() {
  const courseId = '0063da9d-0890-41f9-b63a-f72e7ffdc8a9';
  
  console.log('📋 Testing course update...');
  console.log('Course ID:', courseId);
  
  // First, let's see the current course data
  console.log('\n🔍 Current course data:');
  const { data: currentData, error: fetchError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();
    
  if (fetchError) {
    console.error('❌ Error fetching current course:', fetchError);
    return;
  }
  
  console.log('Current course:', currentData);
  
  // Test a simple update
  console.log('\n🔧 Attempting update...');
  const updateData = {
    title: currentData.title + ' (updated)',
    description: currentData.description || 'Test description',
    semester: currentData.semester || 'Spring',
    year: currentData.year || 2025
  };
  
  console.log('Update data:', updateData);
  
  const { data, error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', courseId)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Update failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Update successful:', data);
    
    // Revert the change
    console.log('\n🔄 Reverting change...');
    const { error: revertError } = await supabase
      .from('courses')
      .update({ title: currentData.title })
      .eq('id', courseId);
      
    if (revertError) {
      console.error('❌ Revert failed:', revertError);
    } else {
      console.log('✅ Reverted successfully');
    }
  }
}

testCourseUpdate().catch(console.error);