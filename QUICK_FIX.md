# Quick Fix - Force Admin Client for Attachments

The service key isn't being detected properly. Let's force the admin client:

## Option 1: Direct Service Key in Code (Temporary)

1. **Get your service key** from Supabase Dashboard → Settings → API
2. **Replace line 22** in `/src/config/supabase.js` with your actual service key:

```javascript
const hardcodedServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // PASTE YOUR ACTUAL SERVICE KEY HERE
```

## Option 2: Check Environment Variable

1. **Check if your `.env` file** is in the project root (same level as `package.json`)
2. **Make sure the line is exactly**:
```
REACT_APP_SUPABASE_SERVICE_KEY=your_service_key_here
```
3. **No spaces around the equals sign**
4. **Restart your development server** completely

## Option 3: Force Admin Client (Nuclear Option)

If the above doesn't work, edit `/src/services/supabaseApi.js` line 9:

```javascript
// Change this line:
const attachmentClient = supabaseAdmin !== supabase ? supabaseAdmin : supabase;

// To this:
const attachmentClient = supabaseAdmin; // Force admin client
```

## Check Console

After making changes, check your browser console for these debug messages:
- `Supabase config debug:`
- `🔐 Attachment client debug:`
- `Using admin client: true`

If you see `Using admin client: false`, the service key isn't being loaded properly.