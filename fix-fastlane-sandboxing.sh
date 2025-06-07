10471852-2f5d-4134-9b31-d0577e5964a4#!/bin/bash

# Fix Fastlane Sandboxing Issue in Jung App
# This script disables ENABLE_USER_SCRIPT_SANDBOXING in both Debug and Release configurations

echo "🔧 Fixing fastlane sandboxing issue..."

# Backup the original file
cp ios/jung.xcodeproj/project.pbxproj ios/jung.xcodeproj/project.pbxproj.backup

# Fix Debug configuration (should already be NO, but ensuring it's correct)
sed -i '' 's/ENABLE_USER_SCRIPT_SANDBOXING = YES;/ENABLE_USER_SCRIPT_SANDBOXING = NO;/g' ios/jung.xcodeproj/project.pbxproj

echo "✅ Updated ENABLE_USER_SCRIPT_SANDBOXING to NO in both Debug and Release configurations"

# Clean build directory
echo "🧹 Cleaning build directory..."
rm -rf ios/build/

# Clean derived data
echo "🧹 Cleaning Xcode derived data..."
rm -rf ~/Library/Developer/Xcode/DerivedData/jung-*

echo "✅ Fastlane sandboxing fix complete!"
echo ""
echo "Next steps:"
echo "1. Open Xcode and clean your project: Product → Clean Build Folder"
echo "2. Rebuild your project"
echo "3. Run your fastlane commands"
echo ""
echo "If you need to revert changes, the original file is backed up as:"
echo "   ios/jung.xcodeproj/project.pbxproj.backup"
