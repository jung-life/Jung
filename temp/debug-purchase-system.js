/**
 * Debug script to diagnose purchase system issues
 * Run with: node debug-purchase-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Purchase System Issues...\n');

// 1. Check Environment Variables
console.log('1. 📋 CHECKING ENVIRONMENT VARIABLES:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const revenueCatAppleKey = envContent.match(/EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=(.+)/);
  const revenueCatGoogleKey = envContent.match(/EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=(.+)/);
  
  console.log(`   ✅ .env file exists`);
  console.log(`   ${revenueCatAppleKey ? '✅' : '❌'} EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: ${revenueCatAppleKey ? 'SET' : 'MISSING'}`);
  console.log(`   ${revenueCatGoogleKey ? '✅' : '❌'} EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY: ${revenueCatGoogleKey ? 'SET' : 'MISSING'}`);
  
  if (revenueCatAppleKey) {
    const key = revenueCatAppleKey[1].trim();
    if (key.startsWith('appl_')) {
      console.log(`   ✅ Apple API key format is correct`);
    } else {
      console.log(`   ❌ Apple API key format is incorrect (should start with 'appl_')`);
    }
  }
} else {
  console.log('   ❌ .env file not found');
}

// 2. Check RevenueCat Service Initialization
console.log('\n2. 🔧 CHECKING REVENUECAT SERVICE INITIALIZATION:');
const appTsxPath = path.join(__dirname, 'src', 'App.tsx');
if (fs.existsSync(appTsxPath)) {
  const appContent = fs.readFileSync(appTsxPath, 'utf8');
  
  const hasImport = appContent.includes('revenueCatService');
  const hasInitialization = appContent.includes('revenueCatService.initialize()');
  
  console.log(`   ${hasImport ? '✅' : '❌'} RevenueCat service imported: ${hasImport}`);
  console.log(`   ${hasInitialization ? '✅' : '❌'} RevenueCat service initialized: ${hasInitialization}`);
} else {
  console.log('   ❌ App.tsx not found');
}

// 3. Check RevenueCat Service Implementation
console.log('\n3. ⚙️ CHECKING REVENUECAT SERVICE IMPLEMENTATION:');
const revenueCatServicePath = path.join(__dirname, 'src', 'lib', 'revenueCatService.ts');
if (fs.existsSync(revenueCatServicePath)) {
  const serviceContent = fs.readFileSync(revenueCatServicePath, 'utf8');
  
  const hasInitializeMethod = serviceContent.includes('async initialize(');
  const hasConfigureMethod = serviceContent.includes('Purchases.configure');
  const hasGetOfferingsMethod = serviceContent.includes('getOfferings');
  
  console.log(`   ✅ RevenueCat service file exists`);
  console.log(`   ${hasInitializeMethod ? '✅' : '❌'} Has initialize method: ${hasInitializeMethod}`);
  console.log(`   ${hasConfigureMethod ? '✅' : '❌'} Has Purchases.configure call: ${hasConfigureMethod}`);
  console.log(`   ${hasGetOfferingsMethod ? '✅' : '❌'} Has getOfferings method: ${hasGetOfferingsMethod}`);
} else {
  console.log('   ❌ RevenueCat service file not found');
}

// 4. Check Credit Service and Database Schema
console.log('\n4. 💾 CHECKING CREDIT SERVICE:');
const creditServicePath = path.join(__dirname, 'src', 'lib', 'creditService.ts');
if (fs.existsSync(creditServicePath)) {
  const creditContent = fs.readFileSync(creditServicePath, 'utf8');
  
  const hasCreditPackageInterface = creditContent.includes('interface CreditPackage');
  const hasGetCreditPackages = creditContent.includes('getCreditPackages()');
  const hasProcessCreditPurchase = creditContent.includes('processCreditPurchase');
  
  console.log(`   ✅ Credit service file exists`);
  console.log(`   ${hasCreditPackageInterface ? '✅' : '❌'} Has CreditPackage interface: ${hasCreditPackageInterface}`);
  console.log(`   ${hasGetCreditPackages ? '✅' : '❌'} Has getCreditPackages method: ${hasGetCreditPackages}`);
  console.log(`   ${hasProcessCreditPurchase ? '✅' : '❌'} Has processCreditPurchase method: ${hasProcessCreditPurchase}`);
} else {
  console.log('   ❌ Credit service file not found');
}

// 5. Check PayWall Component
console.log('\n5. 🎨 CHECKING PAYWALL COMPONENT:');
const paywallPath = path.join(__dirname, 'src', 'components', 'RevenueCatPaywall.tsx');
if (fs.existsSync(paywallPath)) {
  const paywallContent = fs.readFileSync(paywallPath, 'utf8');
  
  const hasTabSupport = paywallContent.includes('activeTab');
  const hasCreditPackageSupport = paywallContent.includes('creditPackages');
  const hasCreditPurchaseHandler = paywallContent.includes('handleCreditPurchase');
  const hasRevenueCatImport = paywallContent.includes('useRevenueCat');
  
  console.log(`   ✅ PayWall component exists`);
  console.log(`   ${hasTabSupport ? '✅' : '❌'} Has tab support: ${hasTabSupport}`);
  console.log(`   ${hasCreditPackageSupport ? '✅' : '❌'} Has credit package support: ${hasCreditPackageSupport}`);
  console.log(`   ${hasCreditPurchaseHandler ? '✅' : '❌'} Has credit purchase handler: ${hasCreditPurchaseHandler}`);
  console.log(`   ${hasRevenueCatImport ? '✅' : '❌'} Has RevenueCat hook import: ${hasRevenueCatImport}`);
} else {
  console.log('   ❌ PayWall component not found');
}

// 6. Check Package.json Dependencies
console.log('\n6. 📦 CHECKING DEPENDENCIES:');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
  
  const hasRevenueCat = deps['react-native-purchases'];
  const hasSupabase = deps['@supabase/supabase-js'];
  
  console.log(`   ${hasRevenueCat ? '✅' : '❌'} react-native-purchases: ${hasRevenueCat || 'MISSING'}`);
  console.log(`   ${hasSupabase ? '✅' : '❌'} @supabase/supabase-js: ${hasSupabase || 'MISSING'}`);
} else {
  console.log('   ❌ package.json not found');
}

// 7. Manual Testing Instructions
console.log('\n7. 🧪 MANUAL TESTING CHECKLIST:');
console.log('   □ Add credit packages to Supabase (run SQL in dashboard)');
console.log('   □ Check app console for RevenueCat initialization logs');
console.log('   □ Check app console for credit package fetch logs');
console.log('   □ Test on physical device (not simulator for purchases)');
console.log('   □ Verify bundle ID matches App Store Connect');
console.log('   □ Create subscription products in App Store Connect');
console.log('   □ Configure offerings in RevenueCat dashboard');

// 8. Quick Fix Commands
console.log('\n8. 🔧 QUICK FIX COMMANDS:');
console.log('   # Add credit packages:');
console.log('   Open Supabase Dashboard → SQL Editor → Run setup-credit-packages.sql content');
console.log('');
console.log('   # Check RevenueCat logs:');
console.log('   # Look for "[RevenueCat]" messages in app console');
console.log('');
console.log('   # Reload app:');
console.log('   # Shake device → Reload or press "r" in Metro terminal');

console.log('\n✅ Diagnostic complete! Check the results above to identify issues.');
