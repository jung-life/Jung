# Quick Commands for Testing Apple Sign In

## You Don't Need to Install Expo CLI Globally!

Good news! Your project already has npm scripts configured. You can use these commands right now:

## Available Commands (Work Right Now)

### For iOS Device Testing:
```bash
# Connect your iPhone via USB cable, then run:
npm run ios

# This is equivalent to: expo run:ios
# But it uses your local project setup
```

### For Development Server:
```bash
# Start the development server
npm start

# This will show QR code for Expo Go app
```

### Alternative Methods:

#### Option 1: Use npx (No Installation)
```bash
# Build directly to connected iPhone
npx expo run:ios --device

# This downloads and runs expo temporarily
```

#### Option 2: Install Expo CLI Globally
```bash
# Install once globally
npm install -g @expo/cli

# Then use directly
expo run:ios --device
```

## Step-by-Step for Apple Sign In Testing

### Method 1: Using Your Existing npm Scripts (Easiest)

1. **Connect iPhone via USB cable**

2. **Run the build command:**
   ```bash
   npm run ios
   ```

3. **If you want to specify device explicitly:**
   ```bash
   # You might need to use npx for the --device flag
   npx expo run:ios --device
   ```

### Method 2: Using EAS Build (Wireless)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login and setup:**
   ```bash
   eas login
   eas device:create
   ```

3. **Build for device:**
   ```bash
   eas build --profile development --platform ios
   ```

## Troubleshooting Your Current Setup

### If `npm run ios` doesn't work:

1. **Check if you have Xcode installed**
2. **Connect iPhone via USB**
3. **Make sure iPhone is unlocked and trusts your computer**

### If you get "No devices found":
```bash
# Try with npx to specify device explicitly
npx expo run:ios --device
```

### If you get build errors:
```bash
# Clear cache and try again
npx expo prebuild --clean
npm run ios
```

## Quick Start for Apple Sign In Testing

### Immediate Next Steps:

1. **Connect your iPhone via USB cable**

2. **Try this command first:**
   ```bash
   npm run ios
   ```

3. **If that doesn't work, try:**
   ```bash
   npx expo run:ios --device
   ```

4. **Once the app installs on your device, test Apple Sign In!**

## Before Testing Apple Sign In

Remember you still need to complete:

1. ✅ **App Configuration** (Already done!)
   - Bundle ID fixed: `org.name.jung`
   - Apple plugin configured
   - Error handling improved

2. ❌ **Apple Developer Console Setup** (Still needed)
   - Create App ID with Sign In with Apple capability
   - Create Service ID for Supabase
   - Generate private key (.p8 file)

3. ❌ **Supabase Configuration** (Still needed)
   - Enable Apple provider
   - Add Apple credentials

## What Will Happen When You Test

### Without Apple Developer Setup:
- App will build and install ✅
- Apple Sign In button will appear ✅
- Tapping it will show the same error you saw before ❌

### After Apple Developer Setup:
- App will build and install ✅
- Apple Sign In button will appear ✅
- Tapping it will show Apple authentication modal ✅
- Sign in will work completely! ✅

## Summary

**You can start testing right now with:**
```bash
npm run ios
```

**This will:**
- Build your app
- Install it on your connected iPhone
- Let you test the current Apple Sign In implementation

**Then complete the Apple Developer Console setup to make Apple Sign In fully functional!**
