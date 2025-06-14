# Google OAuth Setup Guide for CivicSense

This guide walks you through setting up Google Sign-In with Supabase for your CivicSense application.

## Overview

The Google OAuth integration has been implemented with the following components:

- **Updated Supabase client** with OAuth configuration
- **OAuth callback handler** at `/auth/callback`
- **Google OAuth button component** for sign-in/sign-up
- **Updated auth forms** with Google integration
- **Error handling** for OAuth failures

## Setup Steps

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google People API" for profile information

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   
   **Add these to "Authorized JavaScript origins":**
   ```
   http://localhost:3000 (for development)
   https://localhost:3000 (for development with HTTPS)
   https://yourdomain.com (for production)
   ```
   
   **Add these to "Authorized redirect URIs":**
   ```
   http://localhost:3000/auth/callback (for development)
   https://localhost:3000/auth/callback (for development with HTTPS)
   https://yourdomain.com/auth/callback (for production)
   ```
   
   - Save your **Client ID** and **Client Secret**

### 2. Supabase Configuration

1. **Go to your Supabase Dashboard**
   - Navigate to Authentication > Providers
   - Find "Google" in the list of providers

2. **Configure Google Provider**
   - Enable the Google provider
   - Add your Google **Client ID**
   - Add your Google **Client Secret**
   - Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

3. **Configure Site URL**
   - Go to Authentication > Settings
   - Set your Site URL to your production domain (e.g., `https://yourdomain.com`)
   - Add additional redirect URLs if needed:
     ```
     http://localhost:3000 (for development)
     https://yourdomain.com (for production)
     ```

### 3. Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**
   - Navigate to `http://localhost:3000`
   - Click on sign-in from your app
   - Try the "Continue with Google" button
   - You should be redirected to Google's OAuth consent screen
   - After authorization, you should be redirected back to your app

### 5. Localhost Testing Configuration

For testing on localhost, make sure you have these exact URLs configured:

**In Google Cloud Console:**
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/auth/callback`

**In Supabase Dashboard:**
- Site URL: `http://localhost:3000`
- Additional redirect URLs: `http://localhost:3000/auth/callback`

**Important Notes for Localhost:**
- Use `http://` (not `https://`) for localhost unless you have SSL configured
- The port number (3000) must match exactly
- No trailing slashes in the URLs
- Test in an incognito/private browser window to avoid cached auth states

## How It Works

### OAuth Flow

1. **User clicks "Continue with Google"**
   - `GoogleOAuthButton` component initiates the OAuth flow
   - Calls `authHelpers.signInWithGoogle()` from `lib/supabase.ts`

2. **Redirect to Google**
   - User is redirected to Google's OAuth consent screen
   - User authorizes the application

3. **Callback Handling**
   - Google redirects back to `/auth/callback`
   - The callback route exchanges the authorization code for a session
   - User is redirected to the main application

4. **Session Management**
   - Supabase automatically manages the user session
   - `AuthProvider` detects the auth state change
   - User interface updates to show authenticated state

### Components Structure

```
components/auth/
├── auth-dialog.tsx          # Main auth dialog
├── sign-in-form.tsx         # Sign-in with Google + email/password
├── sign-up-form.tsx         # Sign-up with Google + email/password
├── google-oauth-button.tsx  # Reusable Google OAuth button
└── auth-provider.tsx        # Authentication context provider

app/auth/
├── callback/
│   └── route.ts            # OAuth callback handler
└── auth-error/
    └── page.tsx            # Error page for OAuth failures
```

## Customization

### Styling the Google Button

The Google OAuth button follows Google's brand guidelines. You can customize it by modifying the `GoogleOAuthButton` component:

```tsx
// components/auth/google-oauth-button.tsx
<Button
  variant="outline"
  className="w-full flex items-center justify-center space-x-2"
  // Add your custom classes here
>
```

### Handling Additional User Data

After Google OAuth, you might want to collect additional user information. You can modify the callback in the auth forms:

```tsx
const handleGoogleSuccess = async () => {
  // Additional logic after successful Google sign-in
  onSuccess()
}

<GoogleOAuthButton 
  onSuccess={handleGoogleSuccess}
  // ... other props
/>
```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" Error**
   - Check that your redirect URIs in Google Cloud Console match exactly
   - Ensure no trailing slashes in URLs
   - Verify both development and production URLs are added

2. **"Invalid client" Error**
   - Verify your Google Client ID and Client Secret in Supabase
   - Make sure the Google+ API is enabled in Google Cloud Console

3. **User Not Redirected After Sign-In**
   - Check that your Site URL in Supabase is configured correctly
   - Verify the callback route is working by testing the URL directly

4. **PKCE Flow Issues**
   - The integration uses PKCE flow for security
   - Make sure `flowType: 'pkce'` is set in the Supabase client configuration

### Development vs Production

- **Development**: Use `http://localhost:3000` in redirect URIs
- **Production**: Use your actual domain with HTTPS

### User Profile Data

Google OAuth provides additional user data. You can access it through:

```tsx
import { useAuth } from "@/components/auth/auth-provider"

const { user } = useAuth()

// Access user metadata
console.log(user?.user_metadata) // Google profile data
console.log(user?.email)         // User email
console.log(user?.user_metadata?.avatar_url) // Profile picture
```

## Security Considerations

1. **HTTPS Required in Production**
   - Google OAuth requires HTTPS for production domains
   - Local development can use HTTP

2. **PKCE Flow**
   - The implementation uses PKCE (Proof Key for Code Exchange) for enhanced security
   - This prevents authorization code interception attacks

3. **Session Management**
   - Supabase handles secure session management
   - Sessions are automatically refreshed when needed

## Next Steps

After setting up Google OAuth, you might want to:

1. **Customize the user onboarding flow**
2. **Add profile management features**
3. **Implement additional OAuth providers** (Facebook, GitHub, etc.)
4. **Add user role management**
5. **Integrate with your premium subscription system**

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase and Google Cloud Console configurations
3. Test the OAuth flow in incognito mode to avoid caching issues
4. Review the Supabase Auth logs in your dashboard 