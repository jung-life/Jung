#!/bin/bash

echo "🔧 Fixing iOS Build Issues - Jung App"
echo "======================================"

echo "📱 Step 1: Clearing Expo cache..."
expo start -c --non-interactive

echo "🧹 Step 2: Cleaning iOS build artifacts..."
cd ios
rm -rf build/
rm -rf Pods/
rm -f Podfile.lock

echo "📦 Step 3: Installing CocoaPods dependencies..."
pod install --repo-update

echo "🔐 Step 4: Fixing file permissions for shell scripts..."
cd ..
find ios/Pods -name "*.sh" -exec chmod +x {} \; 2>/dev/null || echo "No shell scripts found yet (will be created after pod install)"

echo "⚡ Step 5: Updating Expo CLI..."
npm install -g @expo/cli@latest

echo "🔄 Step 6: Fixing project dependencies..."
npx expo install --fix

echo "📱 Step 7: Updating iOS dependencies..."
cd ios && pod update && cd ..

echo "✅ iOS build fixes applied successfully!"
echo "You can now try running: expo run:ios"
