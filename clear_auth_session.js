// CLEAR AUTH SESSION UTILITY
// Run this in the browser console to clear stuck auth sessions

console.log('🧹 Clearing Supabase auth session...');

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Sign out from Supabase (if available)
if (window.supabase) {
  window.supabase.auth.signOut().then(() => {
    console.log('✅ Supabase auth session cleared');
  }).catch(err => {
    console.log('⚠️ Error clearing Supabase session:', err);
  });
} else {
  console.log('⚠️ window.supabase not available');
}

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies cleared');

console.log('🔄 Please refresh the page now');

// Auto-refresh after 2 seconds
setTimeout(() => {
  window.location.reload();
}, 2000);