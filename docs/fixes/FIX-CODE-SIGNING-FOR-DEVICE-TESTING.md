# Fix Code Signing for iOS Device Testing

## Current Issue
You're getting: `No code signing certificates are available to use.`

This is a normal step when setting up iOS development on a new machine or Apple Developer account.

## Quick Fix Options

### Option 1: EAS Build (Recommended - Easiest)
**Skip the code signing hassle and use EAS to build for your device:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Register your device (we saw it's already detected)
eas device:create

# Build development version
eas build --profile development --platform ios
```

**Benefits:**
- No code signing setup needed
- Handles certificates automatically
- Install via QR code
- Perfect for testing Apple Sign In

### Option 2: Set Up Code Signing (Advanced)
**If you want local building:**

#### Step 1: Apple Developer Account Setup
1. **Get Apple Developer Account** ($99/year)
   - Go to [developer.apple.com](https://developer.apple.com)
   - Enroll in Apple Developer Program

#### Step 2: Create Development Certificate
1. **Open Xcode**
2. **Xcode → Settings (Preferences) → Accounts**
3. **Click "+" → Add Apple ID**
4. **Sign in with your Apple Developer account**
5. **Select your team → "Manage Certificates"**
6. **Click "+" → "Apple Development"**

#### Step 3: Register Your Device
1. **Apple Developer Console → Devices**
2. **Add device with UDID: `00008120-000C792E1E30201E`**
3. **Name it: "Chaitanya's iPhone (2)"**

#### Step 4: Create App ID (Required for Apple Sign In anyway)
1. **Apple Developer Console → Identifiers**
2. **Create App ID: `org.name.jung`**
3. **Enable "Sign In with Apple" capability**

#### Step 5: Create Development Provisioning Profile
1. **Apple Developer Console → Profiles**
2. **Create "iOS App Development" profile**
3. **Select your App ID and certificates**
4. **Select your registered device**
5. **Download and double-click to install**

## Recommended Approach: EAS Build

Since you need to set up Apple Developer account anyway for Apple Sign In, I recommend using EAS build:

### Step-by-Step EAS Setup:

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login
```bash
eas login
```

#### 3. Configure EAS (if not already done)
```bash
eas build:configure
```

#### 4. Register Your Device
```bash
eas device:create
```
**Enter when prompted:**
- Device name: `Chaitanya's iPhone (2)`
- UDID: `00008120-000C792E1E30201E`

#### 5. Build for Device
```bash
eas build --profile development --platform ios
```

#### 6. Install on Device
- EAS will provide a QR code
- Scan with your iPhone camera
- Install the app directly

## What Happens Next

### With EAS Build:
1. ✅ **Build completes** (15-20 minutes)
2. ✅ **App installs** on your device via QR code
3. ✅ **Test Apple Sign In** button (will show improved error)
4. ✅ **Complete Apple Developer setup** to make it fully work

### Required for Apple Sign In (Still Needed):
Even with EAS build, you still need to complete:

1. **Apple Developer Console Setup:**
   - App ID: `org.name.jung`
   - Service ID: `org.name.jung.web`
   - Private key generation

2. **Supabase Configuration:**
   - Enable Apple provider
   - Add Apple credentials

## EAS Configuration

Your project might need an `eas.json` file:

```json
{
  "build": {
    "development": {
      "ios": {
        "buildConfiguration": "Debug",
        "distribution": "internal",
        "simulator": false
      }
    },
    "preview": {
      "ios": {
        "buildConfiguration": "Release",
        "distribution": "internal"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Quick Commands Summary

### For EAS Build (Recommended):
```bash
# One-time setup
npm install -g eas-cli
eas login
eas device:create

# Build for testing
eas build --profile development --platform ios

# Check build status
eas build:list
```

### For Local Build (Advanced):
```bash
# After setting up certificates and provisioning profiles
npx expo run:ios --device
```

## Timeline Expectations

### EAS Build Route:
- **Setup:** 10 minutes
- **Build:** 15-20 minutes
- **Testing Apple Sign In:** Immediate after install

### Local Build Route:
- **Apple Developer setup:** 30-60 minutes
- **Certificate setup:** 15-30 minutes
- **Build:** 5-10 minutes

## Recommendation

**Go with EAS build!** It's:
- ✅ Faster to get started
- ✅ No certificate headaches
- ✅ Professional workflow
- ✅ Same end result for testing Apple Sign In

The Apple Developer Console setup is required anyway for Apple Sign In, so EAS build gets you testing faster while you complete that setup.
