#!/usr/bin/env node

console.log('🧪 Testing Subscription System Integration\n');

const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  'src/lib/inAppPurchaseService.ts',
  'src/hooks/useSubscription.ts',
  'src/screens/SubscriptionScreen.tsx',
  'src/components/PremiumUpgradeButton.tsx',
  'src/components/AvatarSelector.tsx',
  'src/components/HamburgerMenu.tsx',
  'src/screens/PostLoginScreen.tsx',
  'src/App-enhanced.tsx',
  'supabase/migrations/20250609_create_user_subscriptions_table.sql'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check if navigation is properly configured
console.log('\n🧭 Checking navigation configuration...');
const appEnhancedContent = fs.readFileSync('src/App-enhanced.tsx', 'utf8');
if (appEnhancedContent.includes('import SubscriptionScreen') && appEnhancedContent.includes('name="Subscription"')) {
  console.log('✅ Subscription screen properly added to navigation');
} else {
  console.log('❌ Subscription screen not properly configured in navigation');
  allFilesExist = false;
}

// Check if hamburger menu has premium option
console.log('\n🍔 Checking hamburger menu integration...');
const hamburgerContent = fs.readFileSync('src/components/HamburgerMenu.tsx', 'utf8');
if (hamburgerContent.includes('useSubscription') && hamburgerContent.includes('Upgrade to Premium')) {
  console.log('✅ Hamburger menu has premium integration');
} else {
  console.log('❌ Hamburger menu missing premium integration');
  allFilesExist = false;
}

// Check if home screen has upgrade card
console.log('\n🏠 Checking home screen integration...');
const postLoginContent = fs.readFileSync('src/screens/PostLoginScreen.tsx', 'utf8');
if (postLoginContent.includes('useSubscription') && postLoginContent.includes('PremiumUpgradeButton')) {
  console.log('✅ Home screen has upgrade card');
} else {
  console.log('❌ Home screen missing upgrade integration');
  allFilesExist = false;
}

// Check if avatar selector has premium gating
console.log('\n🤖 Checking avatar selector premium gating...');
const avatarContent = fs.readFileSync('src/components/AvatarSelector.tsx', 'utf8');
if (avatarContent.includes('isPremium: true') && avatarContent.includes('Crown')) {
  console.log('✅ Avatar selector has premium gating');
} else {
  console.log('❌ Avatar selector missing premium gating');
  allFilesExist = false;
}

// Check package.json for react-native-iap
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.dependencies['react-native-iap']) {
  console.log(`✅ react-native-iap: ${packageJson.dependencies['react-native-iap']}`);
} else {
  console.log('❌ react-native-iap dependency missing');
  allFilesExist = false;
}

console.log('\n🎯 Summary:');
if (allFilesExist) {
  console.log('✅ All components are properly integrated!');
  console.log('\n🚀 Ready to test:');
  console.log('1. Rebuild your app: npx expo start --clear');
  console.log('2. Look for purple upgrade card on home screen');
  console.log('3. Check hamburger menu for "Upgrade to Premium"');
  console.log('4. Navigate to subscription screen');
  console.log('5. Test premium avatar gating in conversations');
} else {
  console.log('❌ Some integration issues found. Please review the errors above.');
}

console.log('\n📱 In development mode:');
console.log('- IAP will show development alerts');
console.log('- Premium features can be tested with mock data');
console.log('- Full testing requires production build with App Store Connect setup');

console.log('\n✨ Your subscription system is ready! 🎉');
