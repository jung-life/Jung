# Fix Supabase Network Timeout Issue

## 🎉 Great Progress! 
Your app no longer crashes on the splash screen - the crash fixes worked! Now we need to fix the Supabase network timeout that's preventing login.

## Current Issue
- ✅ App loads successfully (no more crashes)
- ❌ Login not working (Apple/Google/Email)
- ❌ Supabase network timeout errors

## Root Cause
The production build doesn't have the correct Supabase environment variables, causing network timeouts when trying to authenticate.

## Quick Fix Steps

### Step 1: Check Current Environment Variables
```bash
# Check what environment variables are currently set
eas secret:list
```

### Step 2: Set Correct Supabase Environment Variables
```bash
# Replace with your actual Supabase values
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-id.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"

# Optional but recommended for full functionality
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "your-anthropic-key"
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-openai-key"
```

### Step 3: Verify Environment Variables
```bash
# List all secrets to confirm they're set
eas secret:list
```

### Step 4: Rebuild and Test
```bash
# Rebuild with correct environment variables
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios
```

## Finding Your Supabase Credentials

### Supabase URL
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (looks like: `https://abcdefgh.supabase.co`)

### Supabase Anon Key
1. In the same **Settings** → **API** section
2. Copy the **anon public** key (long string starting with `eyJ...`)

## Alternative: Quick Test with Development Build

If you want to test login immediately while waiting for the production rebuild:

```bash
# Build development version (uses your local env variables)
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Start development server
npm start

# Install dev build and test login
```

## Verify Environment Variables in Code

You can also check if environment variables are being loaded by looking at the console logs when the app starts. The app should show:

```
Missing Supabase environment variables
EXPO_PUBLIC_SUPABASE_URL: Missing
EXPO_PUBLIC_SUPABASE_ANON_KEY: Missing
```

## Expected Results After Fix

### ✅ Once environment variables are set correctly:
- Supabase client will initialize properly
- Login buttons will work (Apple/Google/Email)
- No more network timeout errors
- Authentication flow will complete successfully

### 🔧 If login still doesn't work:
1. **Apple Sign In:** Needs Apple Developer Console setup
2. **Google Sign In:** Needs Google client configuration
3. **Email Sign In:** Should work immediately with Supabase

## Common Environment Variable Issues

### Issue: Wrong URL format
```bash
# ❌ Wrong: missing https://
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "abcdefgh.supabase.co"

# ✅ Correct: includes https://
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://abcdefgh.supabase.co"
```

### Issue: Wrong key type
```bash
# ❌ Wrong: service_role key (secret, don't use in app)
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ...service_role_key"

# ✅ Correct: anon public key (safe for client apps)
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ...anon_public_key"
```

## Quick Test Commands

```bash
# 1. Check current secrets
eas secret:list

# 2. Set production Supabase credentials
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"

# 3. Rebuild with correct credentials
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios

# 4. Submit to TestFlight
eas submit --platform ios
```

## Success Indicators

### ✅ Environment variables are correct when:
- No "Missing Supabase environment variables" console logs
- Login buttons are responsive
- Network requests to Supabase succeed
- Authentication flow completes

### 🎯 Next Steps After This Fix:
1. **Email login:** Should work immediately
2. **Apple Sign In:** Configure Apple Developer Console
3. **Google Sign In:** Configure Google OAuth

**The network timeout should be resolved once you set the correct Supabase environment variables!**
