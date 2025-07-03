#!/bin/bash

echo "🔵 Testing Google Sign-In Implementation"
echo "========================================"

echo "✅ 1. Checking environment variables..."
if [ -f .env ]; then
    echo "   📄 .env file exists"
    if grep -q "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" .env; then
        echo "   ✅ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID found"
    else
        echo "   ❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing"
    fi
    if grep -q "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" .env; then
        echo "   ✅ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID found"
    else
        echo "   ❌ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID missing"
    fi
else
    echo "   ❌ .env file missing"
fi

echo ""
echo "✅ 2. Checking Google services files..."
if [ -f "GoogleService-Info.plist" ]; then
    echo "   ✅ GoogleService-Info.plist exists"
else
    echo "   ❌ GoogleService-Info.plist missing"
fi

if [ -f "google-services.json" ]; then
    echo "   ✅ google-services.json exists"
else
    echo "   ❌ google-services.json missing"
fi

echo ""
echo "✅ 3. Checking package dependencies..."
if grep -q "@react-native-google-signin/google-signin" package.json; then
    echo "   ✅ @react-native-google-signin/google-signin installed"
else
    echo "   ❌ @react-native-google-signin/google-signin missing"
fi

echo ""
echo "✅ 4. Checking app.json configuration..."
if grep -q "plugins.*@react-native-google-signin/google-signin" app.json; then
    echo "   ✅ Google Sign-In plugin configured in app.json"
else
    echo "   ⚠️  Google Sign-In plugin not found in app.json"
fi

echo ""
echo "🚀 Ready to test!"
echo "Run: npx expo run:ios"
echo ""
echo "📝 What to look for in logs:"
echo "   ✅ '✅ Google Sign-In configured successfully'"
echo "   ✅ No environment variable warnings"
echo "   ✅ Google Sign-In button should work natively"
echo ""
echo "🔍 If Google Sign-In fails, check:"
echo "   1. Environment variables are loaded correctly"
echo "   2. Bundle ID matches Apple Developer Console"
echo "   3. Google OAuth client is configured properly"
echo "   4. Supabase provider settings match your setup"
