#!/usr/bin/env node

/**
 * RevenueCat Configuration Debug Script
 * 
 * This script helps diagnose RevenueCat "Error fetching offerings" issues
 * and provides step-by-step fixes for common configuration problems.
 */

console.log('🔍 RevenueCat Configuration Diagnostic Tool\n');

// Check environment variables
console.log('📋 Checking Environment Variables:');
console.log('='.repeat(50));

const requiredEnvVars = [
  'EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY',
  'EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY', 
  'EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID'
];

const fs = require('fs');
const path = require('path');

let envVars = {};
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.log('❌ .env file not found or unreadable');
}

requiredEnvVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== 'goog_YourGoogleKeyHere') {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: Missing or placeholder value`);
  }
});

console.log('\n📱 Checking App Configuration:');
console.log('='.repeat(50));

// Check app.json for bundle identifier
try {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const bundleId = appJson.expo?.ios?.bundleIdentifier;
  console.log(`✅ Bundle ID: ${bundleId}`);
  
  if (bundleId) {
    console.log(`📝 Note: This Bundle ID must match exactly in:`);
    console.log(`   - RevenueCat Dashboard Project Settings`);
    console.log(`   - App Store Connect App Information`);
    console.log(`   - iOS App Bundle ID in Xcode`);
  }
} catch (error) {
  console.log('❌ Could not read app.json');
}

console.log('\n🛠️  Common RevenueCat "Error fetching offerings" Fixes:');
console.log('='.repeat(60));

console.log(`
1. 🔑 MISSING ENVIRONMENT VARIABLES
   Problem: Missing RevenueCat configuration in .env file
   Fix: Add these to your .env file:
   
   EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_YourAppleKeyHere
   EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_YourGoogleKeyHere  
   EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium

2. 📦 NO PRODUCTS CONFIGURED IN REVENUECAT DASHBOARD
   Problem: No products registered in RevenueCat that match App Store Connect
   Fix Steps:
   a) Go to RevenueCat Dashboard → Projects → Your Project
   b) Navigate to "Products" tab
   c) Click "Add Product" 
   d) Enter exact Product ID from App Store Connect
   e) Configure entitlement "premium" for the product
   
3. 🏪 MISSING PRODUCTS IN APP STORE CONNECT
   Problem: Products don't exist in App Store Connect
   Fix Steps:
   a) Go to App Store Connect → Your App
   b) Navigate to "Features" → "In-App Purchases" 
   c) Create new Auto-Renewable Subscription or In-App Purchase
   d) Set Product ID (e.g., "jung_premium_monthly")
   e) Configure pricing and availability
   f) Submit for review if needed

4. 🔄 BUNDLE ID MISMATCH  
   Problem: Bundle ID doesn't match between RevenueCat and App Store Connect
   Fix: Ensure Bundle ID is identical in:
   - RevenueCat Dashboard Project Settings
   - App Store Connect App Information  
   - app.json expo.ios.bundleIdentifier
   - iOS Xcode project settings

5. 📋 MISSING STOREKIT CONFIGURATION (iOS)
   Problem: StoreKit Configuration file missing for local testing
   Fix Steps:
   a) Open Xcode project
   b) File → New → File → StoreKit Configuration
   c) Add your subscription products to the configuration
   d) Set as active scheme for testing

6. ⏱️  PRODUCTS NOT APPROVED IN APP STORE CONNECT
   Problem: Products exist but not approved/ready
   Fix: Check App Store Connect product status:
   - Status should be "Ready to Submit" or "Approved"
   - Pricing must be configured for at least one territory
   - Product may need App Store review approval

7. 🌐 TESTING IN WRONG ENVIRONMENT
   Problem: Using production RevenueCat key with sandbox products
   Fix: Ensure environment alignment:
   - Development: Use sandbox products in RevenueCat
   - Production: Use live products in RevenueCat
`);

console.log('\n🧪 Testing Commands:');
console.log('='.repeat(30));
console.log(`
1. Test RevenueCat configuration:
   npx expo start --clear

2. Debug RevenueCat in console:
   - Open app in simulator/device
   - Check console logs for detailed RevenueCat errors
   - Look for "RevenueCat Configuration Error" messages

3. Validate environment variables:
   node debug-revenuecat-configuration.js

4. Clear RevenueCat cache:
   rm -rf node_modules/.cache
   npx expo start --clear
`);

console.log('\n📚 Helpful Resources:');
console.log('='.repeat(30));
console.log(`
- RevenueCat Offerings Empty: https://rev.cat/why-are-offerings-empty
- RevenueCat iOS Setup: https://docs.revenuecat.com/docs/ios
- RevenueCat Dashboard: https://app.revenuecat.com
- App Store Connect: https://appstoreconnect.apple.com
`);

console.log('\n✅ Next Steps:');
console.log('='.repeat(20));
console.log(`
1. Fix any ❌ issues listed above
2. Restart your development server: npx expo start --clear  
3. Test the app and check console logs
4. If still having issues, check RevenueCat Dashboard for product configuration
5. Ensure App Store Connect products are properly configured and approved
`);
