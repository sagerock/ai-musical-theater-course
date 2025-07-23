import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Please check your environment variables.');
}

// Single Supabase client instance with proper authentication
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Development debugging
if (typeof window !== 'undefined') {
  window.supabase = supabase;
  
  // Manual logout function for debugging
  window.forceLogout = async () => {
    console.log('🚪 Force logout initiated...');
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Logout complete, refreshing...');
    window.location.reload();
  };
  
  console.log('Supabase config:');
  console.log('URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('Anon key configured:', !!supabaseKey);
  console.log('Auth configured: ✅');
  console.log('Type forceLogout() to logout manually');
}

export default supabase; 