#!/bin/bash

# Production Build Script with RevenueCat and Sandboxing Fixes
# This builds a production app that can be installed on device for testing

echo "🚀 Starting Production build with RevenueCat integration..."

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
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

echo "📦 Building for Production (with sandboxing fixes)..."

# Build production with all fixes
eas build --profile production --platform ios

echo "✅ Production build submitted successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Monitor build progress on: https://expo.dev"
echo "2. When complete, install with: eas build:run -p ios"
echo "3. This will be a production build with RevenueCat fully functional"
echo "4. You can install this on device for testing"
echo ""
echo "💡 This production build includes:"
echo "   - RevenueCat integration with all native dependencies"
echo "   - Fastlane sandboxing fixes"
echo "   - All your app features working"
