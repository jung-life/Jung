#!/bin/bash

echo "🔧 iOS Device Preparation Fix"
echo "=============================="

echo ""
echo "📱 Device Issue: 'Chaitanya's iPhone (2) needs to be prepared for development'"
echo ""

echo "🔍 STEP 1: Check Device Connection"
echo "Make sure your iPhone is:"
echo "  ✓ Connected via USB cable"
echo "  ✓ Unlocked (not on lock screen)"
echo "  ✓ Trusted this computer (tap 'Trust' if prompted)"
echo ""

echo "🔍 STEP 2: Enable Developer Mode on iPhone"
echo "On your iPhone, go to:"
echo "  Settings > Privacy & Security > Developer Mode"
echo "  Toggle 'Developer Mode' ON"
echo "  Restart your iPhone when prompted"
echo ""

echo "🔍 STEP 3: Open Xcode and Prepare Device"
echo "1. Open Xcode"
echo "2. Go to Window > Devices and Simulators"
echo "3. Select your iPhone from the left sidebar"
echo "4. Click 'Use for Development' if shown"
echo "5. Wait for device preparation to complete"
echo ""

echo "🔍 STEP 4: Alternative - Use iOS Simulator"
echo "If device issues persist, try running on simulator:"
echo "  npx expo run:ios"
echo ""

echo "🔍 STEP 5: Check Xcode Logs"
echo "If still failing, check detailed logs:"
echo "  cat /Users/chai/Jung/.expo/xcodebuild.log"
echo ""

echo "🔍 STEP 6: Clean and Rebuild"
echo "Sometimes a clean build helps:"
echo "  cd ios"
echo "  rm -rf build"
echo "  cd .."
echo "  npx expo run:ios --device --clear-cache"
echo ""

echo "💡 QUICK FIX COMMANDS:"
echo "1. Try simulator first:"
echo "   npx expo run:ios"
echo ""
echo "2. If you want to use device after fixing above:"
echo "   npx expo run:ios --device"
echo ""

echo "✅ After following these steps, your device should be ready for development!"
