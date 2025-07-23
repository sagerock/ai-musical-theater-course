// View contact requests in a nice format
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function viewContactRequests() {
  try {
    console.log('📋 Fetching contact requests...\n');

    // Get all contact requests
    const { data: requests, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!requests || requests.length === 0) {
      console.log('✅ No contact requests found.');
      return;
    }

    // Separate new vs contacted requests
    const newRequests = requests.filter(r => r.status === 'new');
    const contactedRequests = requests.filter(r => r.status !== 'new');

    if (newRequests.length > 0) {
      console.log(`🆕 NEW REQUESTS (${newRequests.length}):`);
      console.log('=' .repeat(80));
      
      newRequests.forEach((request, index) => {
        console.log(`\n📧 REQUEST #${index + 1}`);
        console.log(`👤 Name: ${request.name}`);
        console.log(`📨 Email: ${request.email}`);
        console.log(`🏢 Organization: ${request.organization}`);
        console.log(`💼 Role: ${request.role || 'Not specified'}`);
        console.log(`📅 Submitted: ${new Date(request.created_at).toLocaleString()}`);
        
        if (request.message) {
          console.log(`💬 Message:`);
          console.log(`   ${request.message.replace(/\n/g, '\n   ')}`);
        }
        
        console.log(`📧 Reply to: ${request.email}`);
        console.log('-'.repeat(60));
      });
    }

    if (contactedRequests.length > 0) {
      console.log(`\n\n✅ ALREADY CONTACTED (${contactedRequests.length}):`);
      console.log('=' .repeat(50));
      
      contactedRequests.forEach(request => {
        console.log(`• ${request.name} (${request.organization}) - ${new Date(request.created_at).toLocaleDateString()}`);
      });
    }

    // Summary
    console.log(`\n\n📊 SUMMARY:`);
    console.log(`• Total requests: ${requests.length}`);
    console.log(`• New (need response): ${newRequests.length}`);
    console.log(`• Already contacted: ${contactedRequests.length}`);

    if (newRequests.length > 0) {
      console.log(`\n🎯 NEXT STEPS:`);
      console.log(`1. Reply to each of the ${newRequests.length} new request(s) above`);
      console.log(`2. Include: demo info, implementation timeline, pricing, privacy docs`);
      console.log(`3. Mark as contacted by running:`);
      console.log(`   node mark_contacted.js`);
    }

  } catch (error) {
    console.error('❌ Error fetching requests:', error);
  }
}

viewContactRequests();