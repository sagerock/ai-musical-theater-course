// Mark all new contact requests as contacted
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function markContacted() {
  try {
    console.log('📋 Marking new requests as contacted...');

    // Update all new requests to contacted
    const { data, error } = await supabase
      .from('contact_requests')
      .update({ 
        status: 'contacted', 
        contacted_at: new Date().toISOString() 
      })
      .eq('status', 'new')
      .select();

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No new requests to mark as contacted.');
      return;
    }

    console.log(`✅ Marked ${data.length} request(s) as contacted:`);
    data.forEach(request => {
      console.log(`   • ${request.name} (${request.email})`);
    });

  } catch (error) {
    console.error('❌ Error updating requests:', error);
  }
}

markContacted();