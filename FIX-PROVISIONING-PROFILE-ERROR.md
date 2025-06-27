# Fix Provisioning Profile Error for App Store Submission

## Current Issue
You're getting this error when trying to submit:
```
Invalid Provisioning Profile for Apple App Store distribution. The application was signed with an Ad Hoc/Enterprise Provisioning Profile, which is meant for "Internal Distribution". In order to distribute an app on the store, it must be signed with a Distribution Provisioning Profile.
```

## What Happened
You built with the **development** profile but tried to submit to App Store. Development builds are for device testing only, not App Store submission.

## Solution: Build with Production Profile

### Step 1: Build Production Version
```bash
# Build specifically for App Store distribution
eas build --profile production --platform ios
```

### Step 2: Submit Production Build
```bash
# Submit the production build (not development build)
eas submit --platform ios
```

## Understanding Build Profiles

### Development Profile (What you built)
- **Purpose:** Testing on registered devices
- **Distribution:** Internal/Ad Hoc
- **Provisioning:** Development certificates
- **Cannot:** Submit to App Store
- **Can:** Install directly on your device for testing

### Production Profile (What you need for App Store)
- **Purpose:** App Store submission
- **Distribution:** App Store distribution
- **Provisioning:** Distribution certificates
- **Can:** Submit to App Store
- **Cannot:** Install directly on device (unless via TestFlight)

## Complete Workflow for App Store Submission

### For Apple Sign In Testing (Device Only):
```bash
# Use development build - perfect for testing Apple Sign In
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
# Install via QR code and test on device
```

### For App Store Submission:
```bash
# Step 1: Build production version
eas build --profile production --platform ios

# Step 2: Submit to App Store
eas submit --platform ios
```

## What You Should Do Now

### Option A: Just Test Apple Sign In (Recommended)
If you only want to test Apple Sign In, your development build is perfect:
1. ✅ Your development build will install on your device
2. ✅ You can test Apple Sign In functionality
3. ✅ No need to submit to App Store for testing

### Option B: Submit to App Store
If you want to actually submit to App Store:
```bash
# 1. Build production version
eas build --profile production --platform ios

# 2. Wait for build to complete (~20-30 minutes)

# 3. Submit to App Store
eas submit --platform ios
```

## Check Your Current Builds

```bash
# See all your builds
eas build:list

# You should see:
# - development build (for device testing)
# - production build (for App Store) - if you build one
```

## Quick Commands

### For Apple Sign In Testing:
```bash
# Your development build is ready!
# Install via QR code and test Apple Sign In
```

### For App Store Submission:
```bash
# Build production version first
eas build --profile production --platform ios

# Then submit
eas submit --platform ios
```

## Important Notes

1. **Development builds** = Device testing only
2. **Production builds** = App Store submission
3. **For Apple Sign In testing** = Development build is perfect
4. **For public release** = Need production build

## Timeline

### Development Build (Already Done):
- ✅ Ready for Apple Sign In testing on your device

### Production Build (If needed):
- **Build:** 20-30 minutes
- **Submit:** 5-10 minutes
- **App Store Review:** 1-7 days

## Recommendation

**For Apple Sign In testing:** Use your existing development build! It's perfect for testing and will install directly on your device.

**For App Store release:** Build production version when you're ready to release publicly.

You don't need App Store submission to test Apple Sign In - the development build is exactly what you need!
