# Fix iOS Build Error - Xcode Build Phase Issues

## Current Error
Your build is failing with:
```
CommandError: Failed to build iOS project. "xcodebuild" exited with error code 65.
Run script build phase '[CP-User] [Hermes] Replace Hermes for the right configuration, if needed' will be run during every build because it does not specify any outputs.
```

## Root Cause
This is a common iOS build issue with React Native dependencies and Xcode build phases. The error code 65 usually indicates configuration or dependency issues.

## Quick Fixes to Try

### Fix 1: Clear All Caches and Rebuild
```bash
# Clear EAS cache
eas build --profile production --platform ios --clear-cache

# If that fails, try without clear-cache
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

### Fix 2: Use Different Build Profile
```bash
# Try with preview profile instead of production
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile preview --platform ios
```

### Fix 3: Build Development Version (Recommended for Testing)
```bash
# Build development version (often more stable)
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Start development server
npm start
```

### Fix 4: Check for iOS Version Compatibility
The error might be related to iOS version requirements. Try updating your app.json:

```json
{
  "expo": {
    "ios": {
      "deploymentTarget": "13.0"
    }
  }
}
```

### Fix 5: Clean Local Environment
```bash
# Clean local dependencies
rm -rf node_modules
npm install

# Clear Metro cache
npx expo start --clear

# Try building again
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

## Alternative: Test with Current TestFlight Build

Since you already have a working TestFlight build (that loads but has login issues), you can:

1. **Set environment variables** for the current build
2. **Test login** with the debug logging we added
3. **Fix Supabase configuration** without rebuilding yet

### Set Environment Variables for Current Build
```bash
# Set these for your project
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://osmhesmrvxusckjfxugr.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
```

### Test with Development Build (Bypasses Build Issues)
```bash
# Development builds are often more stable
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
npm start
```

## Build Profile Differences

### Production Profile
- **Pros:** Optimized, smaller bundle
- **Cons:** Harder to debug, more build errors

### Development Profile  
- **Pros:** Better debugging, connects to dev server, more stable builds
- **Cons:** Larger bundle, requires dev server

### Preview Profile
- **Pros:** Good middle ground, standalone but less optimized
- **Cons:** Larger than production

## Recommended Approach

### For Immediate Testing:
1. **Build development version** (most likely to succeed)
2. **Test login** with development server
3. **Verify environment variables** work
4. **Fix any login issues**

### For Production:
1. **Fix development version first**
2. **Then try production build** with working configuration
3. **Use preview profile** as fallback

## Commands to Try (In Order)

### Option 1: Development Build (Recommended)
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
npm start
```

### Option 2: Preview Build
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile preview --platform ios
```

### Option 3: Production with Clear Cache
```bash
eas build --profile production --platform ios --clear-cache
```

### Option 4: Production without Capability Sync
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

## Environment Variables Setup

Regardless of build profile, set these:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://osmhesmrvxusckjfxugr.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-supabase-anon-key"
```

## Success Strategy

### Phase 1: Get Working Build
1. Try development build first (most stable)
2. Test login functionality  
3. Verify debug logging shows correct environment variables

### Phase 2: Fix Login
1. Check logs for environment variables
2. Set missing Supabase credentials
3. Test authentication flows

### Phase 3: Production Build
1. Once login works in development
2. Try production build with same configuration
3. Use preview profile as fallback

## Most Likely Solution

**Build development version first:**
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
npm start
```

This will:
- ✅ Avoid the iOS build error (development builds are more stable)
- ✅ Allow immediate testing of login functionality
- ✅ Show debug logs for environment variables
- ✅ Let you fix the Supabase timeout issue

**Once login works in development, then try production build.**
