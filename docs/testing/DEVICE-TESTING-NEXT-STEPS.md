# Device Testing - Next Steps After Hermes Fix

## 🚀 Quick Start Options

### Option 1: EAS Build (Recommended for Production)
```bash
# Build for device using EAS
eas build --platform ios --clear-cache

# For internal testing
eas build --platform ios --profile development

# Submit to TestFlight
eas submit --platform ios
```

### Option 2: Local Xcode Build
```bash
# Clean and build locally
cd ios
rm -rf build
pod install
cd ..

# Then in Xcode:
# 1. Product → Clean Build Folder (Cmd+Shift+K)
# 2. Select your physical device as target
# 3. Product → Build (Cmd+B)
# 4. Product → Run (Cmd+R)
```

## 📱 Device Setup Requirements

### 1. Physical Device Setup
- Connect iPhone/iPad via USB or WiFi
- Device must be registered in Apple Developer account
- Trust computer on device when prompted

### 2. Xcode Configuration
- Open `ios/jung.xcworkspace` (not .xcodeproj)
- Select your device from target dropdown (next to scheme)
- Ensure signing team is set in project settings

### 3. Provisioning Profile
- Check if you have valid provisioning profiles
- May need to update capabilities in Apple Developer portal

## 🔧 Pre-Build Checklist

### 1. Verify Hermes is Working
```bash
# Start Metro bundler
npx expo start --dev-client

# In another terminal, check for Hermes in logs
# Should see "Setting USE_HERMES build settings" when building
```

### 2. Check Existing Build Scripts
You have these helpful scripts already:
- `./eas-build-for-device.sh` - EAS build script
- `./build-ios-local.sh` - Local build script
- `./fix-apple-signin-and-rebuild.sh` - Apple Sign-In fixes

### 3. Review Configuration Files
- `app.json` - Expo configuration
- `eas.json` - EAS build profiles
- `ios/jung/jung.entitlements` - iOS capabilities

## 🏗️ Build and Test Process

### Step 1: Test Local Build First
```bash
# Clean everything
rm -rf ios/build
cd ios && pod install && cd ..

# Open Xcode
open ios/jung.xcworkspace

# In Xcode:
# 1. Clean Build Folder (Cmd+Shift+K)
# 2. Select your device
# 3. Build and Run (Cmd+R)
```

### Step 2: If Local Build Works, Try EAS
```bash
# Use your existing script
./eas-build-for-device.sh

# Or manual EAS build
eas build --platform ios --profile development
```

### Step 3: Install on Device
```bash
# If using EAS, install via:
# 1. Download from EAS dashboard
# 2. AirDrop to device
# 3. Or use EAS CLI: eas build:install

# If using Xcode, app installs automatically when running
```

## 🔍 Testing Hermes Performance

### Verify Hermes is Active
1. **Metro Logs**: Look for Hermes-related messages during bundling
2. **App Performance**: Should see faster startup times
3. **Memory Usage**: Lower memory consumption vs JSC
4. **Bundle Size**: Smaller bundle size

### Performance Indicators
- Faster cold start times
- Reduced memory usage
- Better scroll performance
- Faster navigation

## 🐛 Common Issues & Solutions

### Build Issues
- **Signing Errors**: Check provisioning profiles and team settings
- **Capability Errors**: Update entitlements in Apple Developer portal
- **Dependency Issues**: Run `pod install` again

### Device Issues
- **Trust Issues**: Re-trust computer on device
- **Install Failures**: Check device storage and iOS version compatibility
- **Launch Crashes**: Check device logs in Xcode → Window → Devices and Simulators

## 📋 Next Steps Summary

1. **✅ Hermes Fixed**: Build issues resolved, Hermes enabled
2. **🔄 Clean Build**: Use Xcode to clean and build for device
3. **📱 Test on Device**: Install and test app functionality
4. **🚀 EAS Build**: Create distribution build for wider testing
5. **✈️ TestFlight**: Submit to TestFlight for beta testing

## 🎯 Recommended Workflow

1. **Start with local Xcode build** to verify everything works
2. **Test core functionality** with Hermes enabled
3. **Create EAS development build** for internal team testing
4. **Submit to TestFlight** for broader beta testing
5. **Monitor performance** and verify Hermes benefits

Your app is now ready for device testing with Hermes JavaScript engine properly configured!
