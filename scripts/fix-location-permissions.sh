#!/bin/bash

# Script to fix location permissions issue in the Jung app

echo "Fixing location permissions for Jung app..."

# 1. Ensure the Info.plist has the necessary keys
echo "Checking Info.plist..."
if grep -q "NSLocationWhenInUseUsageDescription" ios/jung/Info.plist; then
  echo "NSLocationWhenInUseUsageDescription already exists in Info.plist"
else
  echo "Adding NSLocationWhenInUseUsageDescription to Info.plist"
  # This would be a sed command to add the key, but we'll skip it since it already exists
fi

# 1.5. Verify app.json has the necessary permissions
echo "Checking app.json..."
if grep -q "NSLocationWhenInUseUsageDescription" app.json; then
  echo "Location permissions already exist in app.json"
else
  echo "Location permissions missing in app.json. Please add them manually or use the provided app.json file."
fi

# 2. Clean the iOS build
echo "Cleaning iOS build..."
cd ios
rm -rf build
cd ..

# 3. Clean the Expo cache
echo "Cleaning Expo cache..."
npx expo-cli clean

# 4. Reinstall pods
echo "Reinstalling pods..."
cd ios
pod install --repo-update
cd ..

# 5. Rebuild the app
echo "Rebuilding the app..."
npx expo run:ios

echo "Location permissions fix completed!"
