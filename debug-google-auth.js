#!/usr/bin/env node

/**
 * Debug script to help diagnose Google OAuth issues
 * Run with: node debug-google-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google OAuth Configuration Debug\n');

// Read app.json
try {
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  console.log('📱 App Configuration:');
  console.log(`Bundle ID: ${appJson.expo.ios?.bundleIdentifier}`);
  console.log(`Package: ${appJson.expo.android?.package}`);

  console.log('\n🔑 OAuth Client IDs:');
  const webClientId = appJson.expo.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = appJson.expo.extra?.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID;

  console.log(`Web Client ID: ${webClientId || 'MISSING'}`);
  console.log(`iOS Client ID: ${iosClientId || 'MISSING'}`);

  if (webClientId) {
    const webProjectNumber = webClientId.split('-')[0];
    console.log(`Web Project Number: ${webProjectNumber}`);
  }

  if (iosClientId) {
    const iosProjectNumber = iosClientId.split('-')[0];
    console.log(`iOS Project Number: ${iosProjectNumber}`);

    if (webClientId && iosClientId) {
      const webProjectNumber = webClientId.split('-')[0];
      const iosProjectNumber = iosClientId.split('-')[0];

      if (webProjectNumber !== iosProjectNumber) {
        console.log('⚠️  WARNING: Web and iOS client IDs are from different projects!');
      } else {
        console.log('✅ Client IDs are from the same project');
      }
    }
  }

  console.log('\n🔗 URL Schemes:');
  const urlSchemes = appJson.expo.ios?.infoPlist?.CFBundleURLTypes || [];
  urlSchemes.forEach((scheme, index) => {
    console.log(`${index + 1}. ${scheme.CFBundleURLName}: ${scheme.CFBundleURLSchemes?.join(', ')}`);
  });

  console.log('\n📦 Plugin Configuration:');
  const plugins = appJson.expo.plugins || [];
  const googlePlugin = plugins.find(p => Array.isArray(p) && p[0] === '@react-native-google-signin/google-signin');
  if (googlePlugin) {
    console.log(`Google Sign-In Plugin URL Scheme: ${googlePlugin[1]?.iosUrlScheme}`);

    // Check if URL scheme matches iOS client ID
    if (iosClientId) {
      const expectedScheme = `com.googleusercontent.apps.${iosClientId.split('.')[0]}`;
      const actualScheme = googlePlugin[1]?.iosUrlScheme;

      if (expectedScheme === actualScheme) {
        console.log('✅ URL scheme matches iOS client ID');
      } else {
        console.log('❌ URL scheme does NOT match iOS client ID');
        console.log(`Expected: ${expectedScheme}`);
        console.log(`Actual: ${actualScheme}`);
      }
    }
  } else {
    console.log('❌ Google Sign-In plugin not found');
  }

} catch (error) {
  console.error('❌ Error reading app.json:', error.message);
}

console.log('\n🛠️  Next Steps:');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Select your project (478933387478)');
console.log('3. Go to APIs & Services > Credentials');
console.log('4. Create a new OAuth 2.0 Client ID with:');
console.log('   - Application type: iOS');
console.log('   - Bundle ID: org.name.jung');
console.log('5. Copy the iOS client ID and update app.json');
console.log('6. Rebuild your app with: expo run:ios');