import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Please check your environment variables.');
}

// Configure Supabase client to work with Firebase auth
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Admin client with service role key (for development only)
// TODO: Replace with actual service key for testing
const hardcodedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia3B4dHJuc2VnaHpzcnZxaGloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMzgyNiwiZXhwIjoyMDY3NDk5ODI2fQ.CHhOVYfTBimQtW_GZW1UVLvbmcPSoOk6GTNAV0HjLuA'; // TEMPORARY - REMOVE IN PRODUCTION

console.log('🔧 SERVICE KEY DEBUG:');
console.log('  - Environment service key exists:', !!supabaseServiceKey);
console.log('  - Environment service key value:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'Not set');
console.log('  - Hardcoded service key exists:', !!hardcodedServiceKey);
console.log('  - Hardcoded service key value:', hardcodedServiceKey ? hardcodedServiceKey.substring(0, 20) + '...' : 'Not set');
console.log('  - Final service key to use:', (supabaseServiceKey || hardcodedServiceKey) ? (supabaseServiceKey || hardcodedServiceKey).substring(0, 20) + '...' : 'None');

export const supabaseAdmin = (supabaseServiceKey || hardcodedServiceKey) ? 
  createClient(supabaseUrl, supabaseServiceKey || hardcodedServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }) : supabase;

// Temporarily make supabase available in console for testing
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  window.supabaseAdmin = supabaseAdmin;
  
  // Debug environment loading
  console.log('Supabase config debug:');
  console.log('URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('Anon key exists:', !!supabaseKey);
  console.log('Service key exists:', !!supabaseServiceKey);
  console.log('Service key value:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'Not set');
  console.log('Hardcoded key exists:', hardcodedServiceKey !== 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE');
  console.log('Using admin client:', supabaseAdmin !== supabase);
}

export default supabase; 