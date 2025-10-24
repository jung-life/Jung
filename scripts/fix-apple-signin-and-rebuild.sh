#!/bin/bash

echo "🍎 Apple Sign In Fix and Rebuild Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

echo "📋 Current Configuration Check:"
echo "Bundle ID in app.json: $(grep -o '"bundleIdentifier": "[^"]*"' app.json | cut -d'"' -f4)"
echo "Apple plugin configured: $(grep -q 'expo-apple-authentication' app.json && echo '✅ Yes' || echo '❌ No')"

echo ""
echo "🧹 Cleaning previous builds..."
rm -rf ios/build
rm -rf .expo

echo ""
echo "🔄 Prebuild with clean slate..."
expo prebuild --clean --platform ios

echo ""
echo "📱 Next steps to fix Apple Sign In:"
echo ""
echo "1. 🏢 Apple Developer Console (REQUIRED):"
echo "   - Go to: https://developer.apple.com/account/"
echo "   - Create App ID with Bundle ID: org.name.jung"
echo "   - Enable 'Sign In with Apple' capability"
echo "   - Create Service ID: org.name.jung.web"
echo "   - Generate private key (.p8 file)"
echo ""
echo "2. 🗃️  Supabase Configuration:"
echo "   - Go to your Supabase dashboard > Authentication > Providers"
echo "   - Enable Apple provider"
echo "   - Configure with Service ID, Team ID, Key ID, and private key"
echo ""
echo "3. 📱 Build and Test:"
echo "   expo run:ios --device"
echo ""
echo "4. 📚 For detailed instructions:"
echo "   - Read: APPLE-SIGN-IN-INTEGRATION-GUIDE.md"
echo "   - Error fix: APPLE-SIGNIN-ERROR-FIX.md"
echo ""
echo "⚠️  Important: Apple Sign In only works on real iOS devices, not simulator!"
echo "✨ Configuration updated successfully!"
