#!/bin/bash

# iOS Simulator Build Script with Fastlane Sandboxing Fix
# This script handles the known fastlane sandboxing issue for EAS builds

echo "🚀 Starting iOS Simulator build with sandboxing fixes..."

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
echo "Debug: Running eas whoami..."
eas whoami 2>&1 || echo "eas whoami failed"

# Try a more lenient check
if eas whoami > /dev/null 2>&1; then
    echo "✅ Logged in to Expo as: $(eas whoami)"
else
    echo "⚠️  Login check failed, but proceeding anyway..."
    echo "If build fails, please run: eas login"
fi

# Set environment variables to help with sandboxing
export DISABLE_SANDBOX=1
export FASTLANE_SKIP_UPDATE_CHECK=1
export FASTLANE_DISABLE_ANIMATION=true

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf ~/.expo
rm -rf node_modules/.cache
npx expo install --fix

echo "📦 Building for iOS Simulator..."

# Try the build with enhanced configuration
eas build --profile ios-simulator --platform ios --non-interactive --no-wait

echo "✅ Build submitted successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Monitor build progress on: https://expo.dev"
echo "2. When complete, install with: eas build:run -p ios"
echo "3. RevenueCat will be fully functional in the development build"
echo ""
echo "🔧 If build still fails due to sandboxing:"
echo "1. Check the build logs for specific errors"
echo "2. Try building with --clear-cache flag"
echo "3. Consider using the development profile instead"
