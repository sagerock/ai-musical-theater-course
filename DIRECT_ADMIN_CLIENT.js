// Direct admin client creation - bypasses any configuration issues
// Add this to the top of supabaseApi.js as a temporary fix

import { createClient } from '@supabase/supabase-js';

// Direct admin client creation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia3B4dHJuc2VnaHpzcnZxaGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMzgyNiwiZXhwIjoyMDY3NDk5ODI2fQ.CHhOVYfTBimQtW_GZW1UVLvbmcPSoOk6GTNAV0HjLuA';

const directAdminClient = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

console.log('🚀 DIRECT ADMIN CLIENT CREATED');
console.log('  - URL:', supabaseUrl);
console.log('  - Service key starts with:', serviceKey.substring(0, 20) + '...');
console.log('  - Client created successfully:', !!directAdminClient);

// Replace the attachmentClient line with:
// const attachmentClient = directAdminClient;