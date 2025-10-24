#!/bin/bash

echo "🔧 Fixing Google Sign-In Implementation for Jung App..."

# 1. Install required dependencies
echo "📦 Installing Google Sign-In dependencies..."
npm install @react-native-google-signin/google-signin

# 2. Update app.json with Google plugin
echo "📝 Updating app.json configuration..."
cp app.json app.json.bak

# Create a temporary script to update app.json
cat > update_app_json.js << 'EOF'
const fs = require('fs');
const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Add Google Sign-In plugin
if (!appConfig.expo.plugins.includes('@react-native-google-signin/google-signin')) {
  appConfig.expo.plugins.push('@react-native-google-signin/google-signin');
}

// Add Google services configuration
appConfig.expo.ios.googleServicesFile = './GoogleService-Info.plist';
appConfig.expo.android.googleServicesFile = './google-services.json';

// Add URL schemes for Google OAuth
if (!appConfig.expo.ios.infoPlist.CFBundleURLTypes) {
  appConfig.expo.ios.infoPlist.CFBundleURLTypes = [];
}

// Add Google URL scheme placeholder
const googleUrlScheme = {
  CFBundleURLName: 'google',
  CFBundleURLSchemes: ['REVERSED_CLIENT_ID_FROM_GOOGLE_PLIST']
};

const hasGoogleScheme = appConfig.expo.ios.infoPlist.CFBundleURLTypes.some(
  type => type.CFBundleURLName === 'google'
);

if (!hasGoogleScheme) {
  appConfig.expo.ios.infoPlist.CFBundleURLTypes.push(googleUrlScheme);
}

fs.writeFileSync('app.json', JSON.stringify(appConfig, null, 2));
console.log('✅ app.json updated successfully');
EOF

node update_app_json.js
rm update_app_json.js

# 3. Create environment variables template
echo "📝 Creating environment variables template..."
cat > .env.template << 'EOF'
# Google OAuth Client IDs
# Get these from Google Cloud Console after creating OAuth credentials
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id.apps.googleusercontent.com

# Copy this file to .env and fill in your actual client IDs
EOF

# 4. Update EAS configuration
echo "📝 Updating EAS configuration..."
cp eas.json eas.json.bak

cat > update_eas_json.js << 'EOF'
const fs = require('fs');
const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));

// Add Google environment variables to all build profiles
const profiles = ['development', 'preview', 'production'];
profiles.forEach(profile => {
  if (easConfig.build[profile]) {
    if (!easConfig.build[profile].env) {
      easConfig.build[profile].env = {};
    }
    
    // Add placeholder environment variables
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS = 'your-ios-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID = 'your-android-client-id';
    easConfig.build[profile].env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB = 'your-web-client-id';
  }
});

fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
console.log('✅ eas.json updated successfully');
EOF

node update_eas_json.js
rm update_eas_json.js

# 5. Create placeholder configuration files
echo "📝 Creating placeholder configuration files..."

cat > GoogleService-Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<!-- 
	PLACEHOLDER FILE - REPLACE WITH ACTUAL GoogleService-Info.plist
	
	Download this file from Google Cloud Console:
	1. Go to https://console.cloud.google.com/
	2. Select your project
	3. Go to Project Settings
	4. Download GoogleService-Info.plist for iOS
	5. Replace this file with the downloaded file
	-->
	<key>CLIENT_ID</key>
	<string>YOUR_CLIENT_ID</string>
	<key>REVERSED_CLIENT_ID</key>
	<string>YOUR_REVERSED_CLIENT_ID</string>
	<key>API_KEY</key>
	<string>YOUR_API_KEY</string>
	<key>GCM_SENDER_ID</key>
	<string>YOUR_SENDER_ID</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>org.name.jung</string>
	<key>PROJECT_ID</key>
	<string>your-project-id</string>
	<key>STORAGE_BUCKET</key>
	<string>your-project-id.appspot.com</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>YOUR_GOOGLE_APP_ID</string>
</dict>
</plist>
EOF

cat > google-services.json << 'EOF'
{
  "_comment": "PLACEHOLDER FILE - REPLACE WITH ACTUAL google-services.json",
  "_instructions": [
    "Download this file from Google Cloud Console:",
    "1. Go to https://console.cloud.google.com/",
    "2. Select your project", 
    "3. Go to Project Settings",
    "4. Download google-services.json for Android",
    "5. Replace this file with the downloaded file"
  ],
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "your-project-id",
    "storage_bucket": "your-project-id.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_MOBILE_SDK_APP_ID",
        "android_client_info": {
          "package_name": "com.yourcompany.jungai"
        }
      },
      "oauth_client": [
        {
          "client_id": "YOUR_ANDROID_CLIENT_ID",
          "client_type": 1,
          "android_info": {
            "package_name": "com.yourcompany.jungai",
            "certificate_hash": "YOUR_SHA1_HASH"
          }
        },
        {
          "client_id": "YOUR_WEB_CLIENT_ID",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "YOUR_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "YOUR_WEB_CLIENT_ID",
              "client_type": 3
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF

echo ""
echo "✅ Google Sign-In implementation updated!"
echo ""
echo "📋 NEXT STEPS REQUIRED:"
echo ""
echo "1. 🌐 Set up Google Cloud Console:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create OAuth 2.0 credentials for iOS and Android"
echo "   - Configure OAuth consent screen"
echo ""
echo "2. 📁 Replace placeholder files:"
echo "   - Replace GoogleService-Info.plist with real file from Google Console"
echo "   - Replace google-services.json with real file from Google Console"
echo ""
echo "3. 🔑 Update environment variables:"
echo "   - Copy .env.template to .env"
echo "   - Fill in your actual Google Client IDs"
echo ""
echo "4. 🔧 Update EAS configuration:"
echo "   - Replace placeholder values in eas.json with real Client IDs"
echo ""
echo "5. 🏗️ Rebuild the app:"
echo "   eas build --platform ios --profile development"
echo ""
echo "📖 For detailed instructions, see: GOOGLE-SIGNIN-SETUP-GUIDE.md"
echo ""
