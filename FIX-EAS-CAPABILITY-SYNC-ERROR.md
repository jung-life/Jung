# Fix EAS Capability Sync Error

## Current Issue
You're getting this error when trying to build:
```
Failed to patch capabilities: [ { capabilityType: 'APPLE_ID_AUTH', option: 'OFF' } ]
✖ Failed to sync capabilities org.name.jung
The bundle '8GPCP8LWN2' cannot be deleted. Delete all the Apps related to this bundle to proceed.
```

## Quick Fix: Disable Auto Capability Sync

EAS is trying to automatically manage Apple Sign In capabilities, but there's a conflict. Let's disable this and handle it manually.

### Option 1: Build with Capability Sync Disabled (Easiest)

```bash
# Set environment variable to skip capability sync
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
```

### Option 2: Add to Your Environment

Add this to your terminal session:
```bash
export EXPO_NO_CAPABILITY_SYNC=1
eas build --profile development --platform ios
```

### Option 3: Manual Apple Developer Console Setup

Since you already have an Apple Developer account, let's manually enable Apple Sign In:

#### 1. Go to Apple Developer Console
- Open: https://developer.apple.com/account/resources/identifiers/bundleId/edit/8GPCP8LWN2
- Or go to: https://developer.apple.com/account/ → Identifiers

#### 2. Find Your App ID
- Look for bundle ID: `org.name.jung`
- Click on it to edit

#### 3. Enable Apple Sign In
- Scroll to "Capabilities"
- Find "Sign In with Apple"
- Check the box to enable it
- Click "Save"

#### 4. Build Without Capability Sync
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
```

## Why This Happens

EAS tries to automatically sync capabilities between your app.json and Apple Developer Console. Since you have the `expo-apple-authentication` plugin configured, it's trying to enable Apple Sign In capability automatically, but there's a conflict with an existing bundle.

## Solution Summary

**Quick command to try right now:**
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
```

This will:
- ✅ Skip the automatic capability sync
- ✅ Build your app for device testing
- ✅ Let you test Apple Sign In functionality
- ✅ You can manually configure capabilities later

## After the Build Succeeds

Once your build completes successfully, you'll need to manually ensure Apple Sign In is enabled:

1. **Go to Apple Developer Console**
2. **Find your App ID: `org.name.jung`**
3. **Enable "Sign In with Apple" capability**
4. **Create Service ID for Supabase integration**
5. **Generate private key (.p8 file)**

## Complete Commands for Success

```bash
# 1. Register your device (if not done already)
eas device:create

# 2. Build with capability sync disabled
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# 3. Wait for build to complete (~15-20 minutes)

# 4. Install via QR code on your device

# 5. Test Apple Sign In button
```

## What to Expect

### With this fix:
- ✅ **Build will succeed**
- ✅ **App will install on your device**
- ✅ **Apple Sign In button will appear**
- ❌ **Apple Sign In will show error (until manual setup)**

### After manual Apple Developer setup:
- ✅ **Apple Sign In will work completely**

## Manual Setup Steps (Do After Build)

1. **Apple Developer Console:**
   - Enable Apple Sign In capability on App ID
   - Create Service ID: `org.name.jung.web`
   - Generate private key

2. **Supabase Configuration:**
   - Enable Apple provider
   - Add Apple credentials

The capability sync error is just a configuration issue - your Apple Sign In code is ready to work once the Apple Developer Console is properly configured!
