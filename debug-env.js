// Temporary debug file - delete after testing
console.log('Environment check:');
console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
console.log('SERVICE_KEY:', process.env.REACT_APP_SUPABASE_SERVICE_KEY?.substring(0, 20) + '...');
console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));