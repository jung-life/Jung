# Google Sign-In Error Fix: "No ID token received from Google or Supabase not available"

## Problem
Users are getting this error when trying to sign in with Google:
```
❌ Google Sign-In error: [Error: No ID token received from Google or Supabase not available]
```

## Diagnostic Results
✅ All environment variables are set correctly
✅ Google services configuration files are present
✅ Supabase configuration appears valid
✅ App configuration is correct

## Root Cause Analysis
The error indicates one of two issues:
1. **Google Sign-In is not returning an ID token** - This usually means the OAuth configuration is incorrect
2. **Supabase client is null** - This means Supabase initialization failed

## Most Likely Causes

### 1. Supabase Google Provider Configuration
The most common cause is that the Google provider in Supabase is not configured with the correct client IDs.

**Required Configuration in Supabase:**
- Go to Supabase Dashboard → Authentication → Providers → Google
- Enable Google provider
- Set **Client ID (for OAuth)** to: `478933387478-6vg33n8ph627csrvi6rg929i014ta5mm.apps.googleusercontent.com`
- Set **Client Secret** to the corresponding secret from Google Console

### 2. Google Console OAuth Configuration
Verify in Google Cloud Console that:
- OAuth 2.0 client IDs are created for:
  - **iOS application** with bundle ID: `org.name.jung`
  - **Web application** for Supabase integration
- The web client ID matches what's in Supabase
- Authorized redirect URIs include your Supabase auth callback URL

### 3. Environment Variable Mismatch
Current environment variables:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=478933387478-6vg33n8ph627csrvi6rg929i014ta5mm.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=478933387478-p4lgnk2bet20h01olhh9kj033d3l1i2h.apps.googleusercontent.com
```

**Verify these match your Google Console configuration.**

## Step-by-Step Fix

### Step 1: Verify Google Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Verify you have these OAuth 2.0 client IDs:
   - **iOS client**: Bundle ID should be `org.name.jung`
   - **Web client**: Should match `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### Step 2: Update Supabase Google Provider
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Click on Google provider
4. Enable it and set:
   - **Client ID**: `478933387478-6vg33n8ph627csrvi6rg929i014ta5mm.apps.googleusercontent.com`
   - **Client Secret**: (Get this from Google Console for the web client)
5. Save the configuration

### Step 3: Verify Redirect URIs
In Google Console, ensure your web client has these authorized redirect URIs:
```
https://osmhesmrvxusckjfxugr.supabase.co/auth/v1/callback
```

### Step 4: Test Supabase Connection
Run this command to test Supabase connectivity:
```bash
node test-supabase-config.js
```

### Step 5: Clear Cache and Rebuild
```bash
# Clear Metro cache
npm run clear-cache
# or
npx expo start --clear

# For iOS development build
npx expo run:ios --clear-cache
```

## Additional Debugging

### Enable Detailed Logging
The Google Sign-In implementation now includes detailed logging. Check the console for:
- `🔵 Initializing Google Sign-In...`
- `🔵 Web Client ID: Set/Missing`
- `🔵 iOS Client ID: Set/Missing`
- `🔵 Google Sign-In successful: {...}`
- `🔵 Authenticating with Supabase...`

### Common Error Messages and Solutions

1. **"EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set"**
   - Check your .env file
   - Restart the development server

2. **"Supabase client not available"**
   - Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
   - Verify Supabase project is active

3. **"No ID token received from Google"**
   - Check Google Console OAuth configuration
   - Verify bundle ID matches
   - Ensure Google Services files are up to date

4. **"Supabase authentication error"**
   - Check Supabase Google provider configuration
   - Verify client ID and secret match Google Console

## Testing Steps

1. **Test Google Sign-In initialization:**
   - Look for "✅ Google Sign-In configured successfully" in logs
   - If you see "❌ Error configuring Google Sign-In", check environment variables

2. **Test Google authentication:**
   - Try signing in with Google
   - Check for "🔵 Google Sign-In successful" with user details
   - Verify `hasIdToken: true` in the logs

3. **Test Supabase integration:**
   - Look for "🔵 Authenticating with Supabase..."
   - Should be followed by "✅ Supabase authentication successful"

## If Issue Persists

1. **Check Google Console quotas and limits**
2. **Verify your Google project has the necessary APIs enabled:**
   - Google+ API (legacy)
   - Google Sign-In API
3. **Check Supabase project status and billing**
4. **Try creating new OAuth credentials in Google Console**

## Files Modified
- `src/lib/googleSignIn.ts` - Improved error handling and logging
- `fix-google-signin-error.js` - Diagnostic script
- Environment variables verification

## Next Steps
After implementing these fixes:
1. Test Google Sign-In with a new user
2. Verify disclaimer flow works correctly
3. Test with existing users
4. Monitor logs for any remaining issues
