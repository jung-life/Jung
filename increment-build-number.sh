#!/bin/bash

# Increment iOS Build Number for Jung App
# This script increments the build number in app.json to resolve duplicate submission issue

echo "📱 Incrementing iOS build number..."

# Backup the original app.json
cp app.json app.json.backup

# Get current timestamp for unique build number
TIMESTAMP=$(date +%s)
NEW_BUILD_NUMBER=$((TIMESTAMP % 10000))

# Use sed to increment build number in app.json
sed -i '' 's/"buildNumber": "1"/"buildNumber": "'$NEW_BUILD_NUMBER'"/g' app.json

echo "✅ Updated build number to: $NEW_BUILD_NUMBER"

# Also update the iOS Info.plist CFBundleVersion to match
sed -i '' 's/<string>2<\/string>/<string>'$NEW_BUILD_NUMBER'<\/string>/g' ios/jung/Info.plist

echo "✅ Updated iOS Info.plist CFBundleVersion to: $NEW_BUILD_NUMBER"

echo ""
echo "🎯 Build number incremented successfully!"
echo "   app.json: buildNumber = \"$NEW_BUILD_NUMBER\""
echo "   Info.plist: CFBundleVersion = \"$NEW_BUILD_NUMBER\""
echo ""
echo "You can now rebuild and resubmit your app without the duplicate build error."
echo ""
echo "To revert changes if needed:"
echo "   cp app.json.backup app.json"
echo "   git checkout ios/jung/Info.plist"
