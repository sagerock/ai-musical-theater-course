# Supabase Service Key Setup

To fix the PDF upload authentication issues, you need to add your Supabase service key to your environment.

## Get Your Service Key

1. Go to your **Supabase Dashboard** → **Settings** → **API**
2. Find the **Service Role** section
3. Click **"Reveal"** next to the service_role key
4. Copy the service_role key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6...`)

## Add to Environment

Add this line to your `.env` file in the project root:

```
REACT_APP_SUPABASE_SERVICE_KEY=your_service_role_key_here
```

⚠️ **IMPORTANT**: 
- The service key has admin privileges - only use in development
- Never commit this key to version control
- Add `.env` to your `.gitignore` file

## Alternative: Direct Configuration

If you don't want to use environment variables, you can temporarily paste the service key directly into `/src/config/supabase.js` at line 22:

```javascript
const hardcodedServiceKey = 'your_service_role_key_here'; // Replace with actual key
```

## After Adding the Key

1. **Restart your development server** (stop and run `npm start` again)
2. **Check the console** - you should see: `Using admin client: true`
3. **Try uploading a PDF** - it should work without authentication errors

## Security Note

The service key bypasses Row Level Security (RLS) and can access all data. This is safe for development but should NEVER be used in production. In production, proper authentication integration should be implemented.