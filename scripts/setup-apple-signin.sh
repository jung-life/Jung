#!/bin/bash

# Apple Sign In Setup Script for Jung App
# This script helps ensure all configurations are in place

echo "🍎 Apple Sign In Setup for Jung App"
echo "=================================="

# Check if required packages are installed
echo "📦 Checking dependencies..."

if grep -q "expo-apple-authentication" package.json; then
    echo "✅ expo-apple-authentication is installed"
else
    echo "❌ expo-apple-authentication not found in package.json"
    echo "   Run: expo install expo-apple-authentication"
fi

if grep -q "expo-crypto" package.json; then
    echo "✅ expo-crypto is installed"
else
    echo "❌ expo-crypto not found in package.json"
    echo "   Run: expo install expo-crypto"
fi

# Check app.json configuration
echo ""
echo "📱 Checking app.json configuration..."

if grep -q "expo-apple-authentication" app.json; then
    echo "✅ expo-apple-authentication plugin is configured"
else
    echo "❌ expo-apple-authentication plugin not found in app.json"
    echo "   Add 'expo-apple-authentication' to plugins array"
fi

if grep -q '"scheme": "jung"' app.json; then
    echo "✅ URL scheme is configured"
else
    echo "❌ URL scheme not configured"
    echo "   Add '\"scheme\": \"jung\"' to app.json"
fi

# Check iOS entitlements
echo ""
echo "🔐 Checking iOS entitlements..."

if [ -f "ios/jung/jung.entitlements" ]; then
    echo "✅ iOS entitlements file exists"
    if grep -q "com.apple.developer.applesignin" ios/jung/jung.entitlements; then
        echo "✅ Apple Sign In entitlement is configured"
    else
        echo "❌ Apple Sign In entitlement not found"
        echo "   Add com.apple.developer.applesignin to entitlements"
    fi
else
    echo "❌ iOS entitlements file not found"
    echo "   Create ios/jung/jung.entitlements with Apple Sign In capability"
fi

# Check implementation files
echo ""
echo "💻 Checking implementation files..."

if [ -f "src/screens/LoginScreen.tsx" ]; then
    if grep -q "AppleAuthentication" src/screens/LoginScreen.tsx; then
        echo "✅ Apple Authentication is imported in LoginScreen"
    else
        echo "❌ Apple Authentication not imported in LoginScreen"
    fi
    
    if grep -q "handleAppleLogin" src/screens/LoginScreen.tsx; then
        echo "✅ Apple login handler is implemented"
    else
        echo "❌ Apple login handler not found"
    fi
else
    echo "❌ LoginScreen.tsx not found"
fi

if [ -f "src/components/SocialButton.tsx" ]; then
    if grep -q "apple" src/components/SocialButton.tsx; then
        echo "✅ Apple button is implemented in SocialButton"
    else
        echo "❌ Apple button not found in SocialButton"
    fi
else
    echo "❌ SocialButton.tsx not found"
fi

# Environment variables check
echo ""
echo "🌍 Environment variables to configure:"
echo "   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"

# Apple Developer Console checklist
echo ""
echo "🏢 Apple Developer Console setup required:"
echo "   1. Create App ID with Bundle ID: com.yourcompany.jung"
echo "   2. Enable 'Sign In with Apple' capability on App ID"
echo "   3. Create Service ID: com.yourcompany.jung.web"
echo "   4. Configure Service ID with your Supabase domain"
echo "   5. Create and download private key (.p8 file)"
echo "   6. Note your Team ID and Key ID"

# Supabase configuration checklist
echo ""
echo "🗃️  Supabase configuration required:"
echo "   1. Go to Authentication > Providers in Supabase dashboard"
echo "   2. Enable Apple provider"
echo "   3. Configure with:"
echo "      - Service ID: com.yourcompany.jung.web"
echo "      - Team ID: [from Apple Developer Console]"
echo "      - Key ID: [from Apple Developer Console]"
echo "      - Private Key: [contents of .p8 file]"
echo "   4. Add redirect URLs:"
echo "      - jung://auth/callback"
echo "      - https://your-project.supabase.co/auth/v1/callback"

# Testing recommendations
echo ""
echo "🧪 Testing recommendations:"
echo "   1. Test on real iOS device (iOS 13+)"
echo "   2. Ensure device is signed into iCloud"
echo "   3. Enable two-factor authentication on Apple ID"
echo "   4. Build with: expo run:ios --device"

echo ""
echo "📚 For detailed instructions, see: APPLE-SIGN-IN-INTEGRATION-GUIDE.md"
echo ""
echo "✨ Setup script completed!"
