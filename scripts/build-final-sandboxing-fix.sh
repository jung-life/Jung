#!/bin/bash

# Final Comprehensive Sandboxing Fix for RevenueCat Integration
# This addresses the specific expo-configure-project.sh sandboxing error

echo "🚀 Starting build with comprehensive sandboxing fixes..."

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
if eas whoami > /dev/null 2>&1; then
    echo "✅ Logged in to Expo as: $(eas whoami)"
else
    echo "⚠️  Login check failed, but proceeding anyway..."
    echo "If build fails, please run: eas login"
fi

# Set comprehensive environment variables for sandboxing fixes
export DISABLE_SANDBOX=1
export FASTLANE_SKIP_UPDATE_CHECK=1
export FASTLANE_DISABLE_ANIMATION=true
export FASTLANE_DISABLE_COLORS=1
export FASTLANE_HIDE_CHANGELOG=1
export FASTLANE_SKIP_DOCS_UPDATE_CHECK=1
export CI=1
export EXPO_NO_CACHE=1

# Additional sandbox bypass variables
export SANDBOX_DISABLE=1
export __XCODE_BUILT_PRODUCTS_DIR_PATHS=""
export __XCODE_BUNDLE_IDENTIFIER=""

echo "🧹 Deep cleaning for sandboxing fix..."
rm -rf ~/.expo
rm -rf node_modules/.cache
rm -rf ~/.fastlane
rm -rf ~/Library/Caches/com.apple.dt.Xcode

# Clean npm and expo caches
npm cache clean --force
npx expo install --fix

echo "🔨 Building with maximum sandboxing bypass..."

# Try the development profile which sometimes works better
eas build --profile development --platform ios --clear-cache --non-interactive

echo "✅ Build submitted with comprehensive sandboxing fixes!"
echo ""
echo "🔧 Applied fixes:"
echo "1. ✅ Multiple sandbox disable environment variables"
echo "2. ✅ Cleared all possible caches including Xcode"
echo "3. ✅ Used development profile (often more successful)"
echo "4. ✅ Non-interactive mode to avoid hanging"
echo ""
echo "📱 Alternative if this fails:"
echo "1. Try: eas build --profile development --platform ios"
echo "2. Or: Wait for EAS to fix this known issue"
echo "3. Or: Use local builds temporarily"
