# Environment Setup Instructions

## Step 1: Create your .env.local file

Create a file called `.env.local` in your project root with the following content:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://bfz6himfzfsinse7.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_from_supabase



# OpenAI API Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## Step 2: Fill in your values

1. **Supabase Anon Key**: Copy the `anon` `public` key from your Supabase dashboard (the one visible in your screenshot)


   - Copy the config values

3. **OpenAI API Key**: Get this from https://platform.openai.com/api-keys

## Step 3: Install dependencies and run

```bash
npm install
npm run dev
```

Your app will be available at http://localhost:3000 