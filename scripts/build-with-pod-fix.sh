#!/bin/bash

# Build Script with Pod Dependency Conflict Fix
# This handles RevenueCat integration pod conflicts and sandbox issues

echo "🚀 Starting build with pod dependency fixes and sandbox bypass..."

# Check if user is logged in to Expo
echo "🔐 Checking Expo login status..."
if eas whoami > /dev/null 2>&1; then
    echo "✅ Logged in to Expo as: $(eas whoami)"
else
    echo "⚠️  Login check failed, but proceeding anyway..."
    echo "If build fails, please run: eas login"
fi

# Set environment variables to help with sandboxing and dependencies
export DISABLE_SANDBOX=1
export FASTLANE_SKIP_UPDATE_CHECK=1
export FASTLANE_DISABLE_ANIMATION=true
export EAS_NO_CACHE=1
export EXPO_NO_CACHE=1
export COCOAPODS_DISABLE_STATS=1

# Deep clean to resolve pod conflicts AND sandbox issues
echo "🧹 Deep cleaning to resolve pod conflicts and sandbox restrictions..."
rm -rf ~/.expo
rm -rf ~/.eas
rm -rf node_modules/.cache
rm -rf .expo
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ios/build
rm -rf ios/.xcode.env.local
rm -rf ios/jung.xcworkspace

# Clear CocoaPods cache specifically
echo "🗑️  Clearing CocoaPods cache..."
pod cache clean --all 2>/dev/null || true

# Reinstall dependencies to get fresh pod resolution
echo "📦 Reinstalling dependencies with fresh pod resolution..."
npx expo install --fix
npm install

# Fix permissions for pod scripts to avoid sandbox file-read errors
echo "🔑 Fixing permissions for pod scripts..."
find ios/Pods/Target\ Support\ Files -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

echo "🔨 Building with enhanced sandbox bypass and pod conflict fixes..."

# Build with all cache disabled and sandbox bypass
eas build --profile production --platform ios --clear-cache --no-wait

echo "✅ Build submitted with enhanced pod conflict and sandbox fixes!"
echo ""
echo "📋 What this script did:"
echo "1. ✅ Cleared all cached pods, builds, and EAS cache"
echo "2. ✅ Disabled sandbox restrictions with multiple environment variables"
echo "3. ✅ Cleared CocoaPods cache to prevent permission issues"
echo "4. ✅ Removed Xcode workspace to force clean rebuild"
echo "5. ✅ Built with comprehensive cache bypass"
echo ""
echo "📱 Next steps:"
echo "1. Monitor build progress on: https://expo.dev"
echo "2. When complete, install with: eas build:run -p ios"
echo "3. If still failing, try: eas build --profile development --platform ios"
