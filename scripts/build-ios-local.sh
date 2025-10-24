#!/bin/bash

echo "🏗️  Building Jung App Locally for iOS"
echo "====================================="

echo "🔍 Checking prerequisites..."

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed or command line tools are not available"
    echo "Please install Xcode and run: sudo xcode-select --install"
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "❌ CocoaPods is not installed"
    echo "Please install CocoaPods: sudo gem install cocoapods"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "✅ Prerequisites checked"

echo "🔧 Applying iOS build fixes..."

# Fix file permissions for shell scripts
echo "🔐 Fixing shell script permissions..."
find ios/Pods -name "*.sh" -exec chmod +x {} \; 2>/dev/null || echo "No Pods directory found yet"

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf ios/build/

echo "📱 Building for iOS simulator..."
npx expo run:ios --configuration Release

echo "✅ Local iOS build process completed!"
echo ""
echo "📱 To build for a physical device instead, run:"
echo "   npx expo run:ios --device --configuration Release"
echo ""
echo "🚀 To test on different simulators, run:"
echo "   npx expo run:ios --simulator=\"iPhone 15 Pro\""
echo "   npx expo run:ios --simulator=\"iPad Pro (12.9-inch)\""
