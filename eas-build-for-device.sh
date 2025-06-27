#!/bin/bash

echo "🚀 EAS Build for Apple Sign In Testing"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

echo "📋 Your Device Info (from previous detection):"
echo "   Device: Chaitanya's iPhone (2) (18.5)"
echo "   UDID: 00008120-000C792E1E30201E"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

echo ""
echo "🔑 Next steps for EAS build:"
echo ""
echo "1. Login to EAS (if not already logged in):"
echo "   eas login"
echo ""
echo "2. Register your device:"
echo "   eas device:create"
echo "   📱 Use these details when prompted:"
echo "      Name: Chaitanya's iPhone (2)"
echo "      UDID: 00008120-000C792E1E30201E"
echo ""
echo "3. Build development version:"
echo "   eas build --profile development --platform ios"
echo ""
echo "4. Install on device:"
echo "   📱 Scan QR code when build completes"
echo "   📱 App will install directly on your iPhone"
echo ""
echo "5. Test Apple Sign In:"
echo "   📱 Open app → Login → Tap 'Sign in with Apple'"
echo "   📱 You'll see improved error messages"
echo ""
echo "⏱️  Expected timeline:"
echo "   Setup: 5-10 minutes"
echo "   Build: 15-20 minutes"
echo "   Total: ~25 minutes"
echo ""
echo "🔗 After testing, complete Apple Developer Console setup:"
echo "   📋 See: APPLE-SIGN-IN-INTEGRATION-GUIDE.md"
echo ""
echo "🚀 Ready to start? Run these commands:"
echo "   eas login"
echo "   eas device:create"
echo "   eas build --profile development --platform ios"
