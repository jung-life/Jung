#!/bin/bash

echo "🔧 Fixing EAS JSON Validation Issues..."

# First, let's backup the current eas.json
cp eas.json eas.json.broken.bak

echo "📝 Creating valid eas.json configuration..."

cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 7.3.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id",
        "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID": "your-android-client-id"
      },
      "ios": {
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "developmentBuild"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id",
        "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID": "your-android-client-id"
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id",
        "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID": "your-android-client-id"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "ios-simulator": {
      "extends": "development",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "env": {
        "NODE_ENV": "development",
        "EXPO_PUBLIC_ENVIRONMENT": "simulator",
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id",
        "EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID": "your-android-client-id"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# Now let's handle Apple Sign-In capabilities in app.json instead
echo "📝 Moving Apple Sign-In capabilities to app.json..."

cat > update_app_json_capabilities.js << 'EOF'
const fs = require('fs');
const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Ensure Apple Sign-In capability is in app.json, not eas.json
if (!appConfig.expo.ios.entitlements) {
  appConfig.expo.ios.entitlements = {};
}

// Add Apple Sign-In entitlement
appConfig.expo.ios.entitlements['com.apple.developer.applesignin'] = ['Default'];

fs.writeFileSync('app.json', JSON.stringify(appConfig, null, 2));
console.log('✅ Apple Sign-In capabilities moved to app.json');
EOF

node update_app_json_capabilities.js
rm update_app_json_capabilities.js

echo ""
echo "✅ EAS JSON validation issues fixed!"
echo ""
echo "🔧 WHAT WAS FIXED:"
echo "   ✅ Removed invalid 'capabilities' from eas.json iOS sections"
echo "   ✅ Added Apple Sign-In entitlements to app.json instead"
echo "   ✅ Updated all environment variables for Google Sign-In"
echo "   ✅ Created valid EAS build configuration"
echo ""
echo "📋 NOW YOU CAN GET SHA-1 FINGERPRINT:"
echo ""
echo "1. 🔄 Update EAS CLI to latest version:"
echo "   npm install -g eas-cli"
echo ""
echo "2. 📱 Get Android SHA-1 fingerprint:"
echo "   eas credentials -p android"
echo ""
echo "3. 🔑 Alternative method to get SHA-1:"
echo "   eas build:configure -p android"
echo "   # This will show you the SHA-1 during configuration"
echo ""
echo "4. 🌐 Use SHA-1 in Google Cloud Console for Android OAuth client"
echo ""
echo "🎯 After getting the SHA-1, continue with Google Cloud Console setup!"
echo ""
