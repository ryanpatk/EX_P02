# GitHub OAuth Setup for EX_P02

## Overview
This document explains how to configure GitHub OAuth authentication for the EX_P02 application using Supabase.

## Required Setup

### 1. GitHub OAuth App Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `EX_P02` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Authorization callback URL**: `https://YOUR_SUPABASE_URL/auth/v1/callback`
     - Replace `YOUR_SUPABASE_URL` with your actual Supabase project URL
     - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

### 2. Supabase Configuration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your EX_P02 project
3. Go to **Authentication > Providers**
4. Find **GitHub** in the list and click to configure
5. Enable GitHub provider
6. Enter the GitHub OAuth credentials:
   - **Client ID**: (from GitHub OAuth app)
   - **Client Secret**: (from GitHub OAuth app)
7. **Save** the configuration

### 3. Site URL Configuration

1. In Supabase Dashboard, go to **Authentication > URL Configuration**
2. Add your site URLs:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: 
     - `http://localhost:5173/dashboard`
     - `https://your-production-domain.com/dashboard` (for production)

### 4. Production Setup

For production deployment, you'll need to:

1. **Update GitHub OAuth App**:
   - Add production homepage URL
   - Add production callback URL: `https://YOUR_SUPABASE_URL/auth/v1/callback`

2. **Update Supabase URL Configuration**:
   - Add production site URL
   - Add production redirect URLs

## How It Works

1. User clicks "Continue with GitHub" button
2. User is redirected to GitHub's authorization page
3. User authorizes the application
4. GitHub redirects back to Supabase with authorization code
5. Supabase exchanges the code for an access token
6. Supabase creates/updates user record and session
7. User is redirected to `/dashboard` with active session

## Code Implementation

The GitHub OAuth functionality is implemented in:

- `src/pages/HomePage.tsx` - GitHub button on home page
- `src/pages/auth/SignInPage.tsx` - GitHub button on sign-in page
- `src/pages/auth/SignUpPage.tsx` - GitHub button on sign-up page

All implementations use:
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});
```

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that the callback URL in GitHub matches your Supabase URL exactly
   - Ensure no trailing slashes

2. **"Unauthorized redirect_uri"** 
   - Verify the redirect URLs are added to Supabase URL Configuration
   - Check that the domain matches exactly

3. **User created but redirect fails**
   - Verify the redirect URL is in Supabase's allowed redirect URLs
   - Check browser console for errors

### Testing OAuth Flow:

1. Ensure Supabase is configured correctly
2. Start development server: `npm run dev`
3. Navigate to sign-in page
4. Click "Continue with GitHub"
5. Authorize on GitHub
6. Should redirect to `/dashboard` with user logged in

## Security Notes

- Keep GitHub Client Secret secure and never commit it to version control
- Use environment variables for sensitive configuration in production
- Regularly rotate OAuth credentials
- Monitor OAuth app usage in GitHub settings