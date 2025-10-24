# EAS Build and Submit Guide

## For Testing Apple Sign In vs App Store Submission

### Option 1: EAS Build for Device Testing (Recommended for Apple Sign In)

**Purpose:** Test Apple Sign In on your physical device without App Store submission

#### Step 1: Register Your Device
```bash
# Register your iPhone for development builds
eas device:create

# Use these details when prompted:
# Device Name: Chaitanya's iPhone (2)
# UDID: 00008120-000C792E1E30201E
```

#### Step 2: Build Development Version
```bash
# Build for device testing (bypasses capability sync issue)
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Alternative without environment variable (if capability sync is fixed)
eas build --profile development --platform ios
```

#### Step 3: Install on Device
- EAS will provide a QR code after build completes
- Scan QR code with your iPhone camera
- Install app directly on your device
- Test Apple Sign In functionality

### Option 2: EAS Build and Submit to App Store

**Purpose:** Submit to App Store for public release or TestFlight

#### Step 1: Build Production Version
```bash
# Build production version for App Store
eas build --profile production --platform ios
```

#### Step 2: Submit to App Store
```bash
# Submit the build to App Store Connect
eas submit --platform ios

# You'll be prompted to:
# - Select the build to submit
# - Provide App Store Connect credentials
```

#### Step 3: TestFlight or App Store Release
- **TestFlight:** Build will be available for beta testing
- **App Store:** Submit for review and public release

## Complete Commands Reference

### For Apple Sign In Testing (Device Only):
```bash
# One-time setup
eas device:create

# Build for your device
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Monitor build progress
eas build:list

# Install via QR code when complete
```

### For App Store Submission:
```bash
# Build production version
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios

# Check submission status
eas submit:list
```

## Build Profiles Explained

### Development Profile
- **Purpose:** Testing on registered devices
- **Distribution:** Internal (your team only)
- **Installation:** Direct install via QR code
- **Signing:** Development certificates
- **Best for:** Apple Sign In testing

### Preview Profile
- **Purpose:** Internal testing and sharing
- **Distribution:** Internal (via TestFlight)
- **Installation:** TestFlight app
- **Best for:** Team testing

### Production Profile
- **Purpose:** App Store release
- **Distribution:** App Store or TestFlight
- **Installation:** App Store or TestFlight
- **Signing:** Distribution certificates
- **Best for:** Public release

## Your EAS Configuration

Your `eas.json` is already configured with these profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Timeline Expectations

### Development Build (Device Testing):
- **Build:** 15-20 minutes
- **Install:** 1 minute
- **Test Apple Sign In:** Immediate

### Production Build + Submit:
- **Build:** 20-30 minutes
- **Submit:** 5-10 minutes
- **App Store Review:** 1-7 days
- **TestFlight:** Available immediately after processing

## Recommended Workflow for Apple Sign In

### Phase 1: Development Testing
```bash
# Register device
eas device:create

# Build and test
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Install and test Apple Sign In on device
```

### Phase 2: Team Testing (Optional)
```bash
# Build preview version
eas build --profile preview --platform ios

# Submit to TestFlight for team testing
eas submit --platform ios
```

### Phase 3: Production Release
```bash
# Build production version
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

## For Apple Sign In Specifically

**You only need development build to test Apple Sign In!**

1. **Build for device:** `EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios`
2. **Install via QR code**
3. **Test Apple Sign In button**
4. **Complete Apple Developer Console setup**
5. **Apple Sign In will work completely**

## Common Commands

```bash
# Check build status
eas build:list

# Check submission status  
eas submit:list

# Cancel a build
eas build:cancel [build-id]

# View build logs
eas build:view [build-id]

# List your devices
eas device:list

# Update CLI
npm install -g eas-cli
```

## What You Need Right Now

**For Apple Sign In testing, you only need:**

```bash
# 1. Register device (one time)
eas device:create

# 2. Build for testing
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# 3. Install and test!
```

**You do NOT need to submit to App Store to test Apple Sign In!**

The development build will install directly on your device and let you test Apple Sign In functionality immediately.
