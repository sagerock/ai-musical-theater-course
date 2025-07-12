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
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Admin client with service role key (for development only)
// TODO: Replace with actual service key for testing
const hardcodedServiceKey = 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'; // TEMPORARY - REMOVE IN PRODUCTION

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
  console.log('Using admin client:', supabaseAdmin !== supabase);
}

export default supabase; 