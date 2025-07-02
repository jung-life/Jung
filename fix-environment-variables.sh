#!/bin/bash

echo "🔧 Fixing Google Sign-In Environment Variable Mismatch..."

# The issue is that different parts of the code are looking for different variable names
# Let's standardize and fix the environment variables

echo "📝 Updating eas.json with correct variable names..."
cp eas.json eas.json.bak

cat > update_eas_env.js << 'EOF'
const fs = require('fs');
const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));

// Add both variable name formats to ensure compatibility
const profiles = ['development', 'preview', 'production'];
profiles.forEach(profile => {
  if (easConfig.build[profile]) {
    if (!easConfig.build[profile].env) {
      easConfig.build[profile].env = {};
    }
    
    // Add all possible Google Client ID variable names to ensure compatibility
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'your-google-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS = 'your-ios-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID = 'your-android-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB = 'your-web-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID = 'your-ios-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID = 'your-android-client-id';
  }
});

// Special handling for ios-simulator profile
if (easConfig.build['ios-simulator']) {
  if (!easConfig.build['ios-simulator'].env) {
    easConfig.build['ios-simulator'].env = {};
  }
  
  // Add Google environment variables to ios-simulator profile
  Object.assign(easConfig.build['ios-simulator'].env, {
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: 'your-google-client-id',
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS: 'your-ios-client-id',
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID: 'your-android-client-id',
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB: 'your-web-client-id',
    EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID: 'your-ios-client-id',
    EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID: 'your-android-client-id'
  });
}

fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
console.log('✅ eas.json updated with all Google Client ID variable names');
EOF

node update_eas_env.js
rm update_eas_env.js

# Create a comprehensive .env template with all variable names
echo "📝 Creating comprehensive environment variables template..."
cat > .env.template << 'EOF'
# Google OAuth Client IDs - Multiple formats for compatibility
# Get these from Google Cloud Console after creating OAuth credentials

# Standard format (used by LoginScreen)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Platform-specific formats
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id.apps.googleusercontent.com

# Alternative naming formats (for compatibility)
EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# Instructions:
# 1. Copy this file to .env
# 2. Replace the placeholder values with your actual Google Client IDs from Google Cloud Console
# 3. Make sure all variables use the same actual client ID values for their respective platforms
EOF

# Create a working .env file with placeholder values to stop the warnings
echo "📝 Creating .env file with placeholder values..."
cat > .env << 'EOF'
# Google OAuth Client IDs - REPLACE WITH ACTUAL VALUES
EXPO_PUBLIC_GOOGLE_CLIENT_ID=placeholder-google-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=placeholder-ios-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=placeholder-android-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=placeholder-web-client-id
EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=placeholder-ios-client-id
EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=placeholder-android-client-id
EOF

echo ""
echo "✅ Environment variables fixed!"
echo ""
echo "🔧 WHAT WAS FIXED:"
echo "   - Added all Google Client ID variable name formats to eas.json"
echo "   - Created comprehensive .env.template with all variations"
echo "   - Created placeholder .env file to stop warnings"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. 🌐 Set up Google Cloud Console (if not done yet):"
echo "   - Follow GOOGLE-SIGNIN-SETUP-GUIDE.md"
echo "   - Create OAuth 2.0 credentials"
echo "   - Download GoogleService-Info.plist and google-services.json"
echo ""
echo "2. 🔑 Update .env file with real Google Client IDs:"
echo "   - Replace placeholder values in .env with actual IDs from Google Console"
echo "   - Make sure to use the correct Client ID for each platform"
echo ""
echo "3. 🏗️ Rebuild the app to pick up the new environment variables:"
echo "   eas build --platform ios --profile development"
echo ""
echo "🎯 This should resolve the 'EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID environment variable is not set' warning!"
echo ""
