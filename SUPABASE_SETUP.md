# Supabase Setup Guide for Google OAuth

This guide will help you set up Google OAuth authentication in your Supabase project.

## Prerequisites

1. A Google Cloud Console account
2. A Supabase project (already created)

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add these authorized redirect URIs:
     ```
     https://mevtfkebjmczjqrszyrp.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback (for local development)
     ```
   - Copy the Client ID and Client Secret

## Step 2: Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" > "Providers"
4. Find "Google" and enable it
5. Enter your Google OAuth credentials:
   - **Client ID**: The Client ID from Google Cloud Console
   - **Client Secret**: The Client Secret from Google Cloud Console
6. Save the configuration

## Step 3: Update Environment Variables

Add these to your `.env.local` file (create it if it doesn't exist):

```env
NEXT_PUBLIC_SUPABASE_URL=https://mevtfkebjmczjqrszyrp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldnRma2Viam1jempxcnN6eXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTUyMjIsImV4cCI6MjA3NTY3MTIyMn0.IEwDccL9MmYY6HMJB02yQlrvalOViF4gJ02w685byPI
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=AIzaSyCB4bID8hmWlGhdx_r7F0Vq3c7df0UBp0s
```

### Getting Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to "Settings" > "API"
3. Copy the "service_role" key (NOT the anon key)
4. Replace `your_service_role_key_here` with the actual service role key

**⚠️ Important**: The service role key has admin privileges. Keep it secure and never commit it to version control!

## Step 4: Database Schema Updates

You need to run the database migration to fix the foreign key constraints. This migration will:

1. Update the `user_interactions` table to work with Supabase's `auth.users`
2. Create proper RLS policies for authenticated users
3. Add automatic user profile creation

### Run the Migration

1. Go to your Supabase Dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `supabase/migrations/20250110000000_fix_auth_schema.sql`
4. Click "Run" to execute the migration

This migration will fix the foreign key constraint errors you're seeing.

### Optional: Additional User Profile Enhancements

The authentication system will automatically create user profiles when users sign in with Google. You may want to add these optional improvements:

### Optional: Add User Profile Table

```sql
-- Create a profiles table to store additional user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should be redirected to the sign-in page
4. Click "Continue with Google"
5. Complete the OAuth flow
6. You should be redirected back to the main page

## Troubleshooting

### Common Issues:

1. **Redirect URI mismatch**: Make sure the redirect URIs in Google Cloud Console exactly match what Supabase expects
2. **CORS issues**: Ensure your domain is properly configured in both Google Cloud Console and Supabase
3. **API not enabled**: Make sure the Google+ API is enabled in Google Cloud Console
4. **Invalid credentials**: Double-check that the Client ID and Secret are correctly copied to Supabase

### Testing with Different Environments:

- **Local development**: Use `http://localhost:3000/auth/callback`
- **Production**: Use `https://yourdomain.com/auth/callback`

## Security Notes

1. Never commit your `.env.local` file to version control
2. Use different OAuth credentials for development and production
3. Regularly rotate your OAuth credentials
4. Monitor your Supabase logs for any authentication issues

## Additional Features

Once Google OAuth is working, you can:

1. Add user profile management
2. Implement role-based access control
3. Add social login with other providers
4. Implement email verification flows
5. Add user preferences and settings

Your authentication system is now ready to use! Users will be able to sign in with their Google accounts and get personalized recommendations based on their browsing history.
