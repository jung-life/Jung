#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Installing In-App Purchase Subscription System...\n');

// Check if navigation types file exists
const navigationTypesPath = 'src/navigation/types.ts';
if (fs.existsSync(navigationTypesPath)) {
  console.log('📝 Updating navigation types...');
  
  let typesContent = fs.readFileSync(navigationTypesPath, 'utf8');
  
  // Add Subscription to the navigation types if not already present
  if (!typesContent.includes('Subscription:')) {
    // Find the RootStackParamList type definition
    const stackParamListRegex = /(export\s+type\s+RootStackParamList\s*=\s*{[^}]*)/;
    const match = typesContent.match(stackParamListRegex);
    
    if (match) {
      const beforeClosing = match[1];
      if (!beforeClosing.includes('Subscription:')) {
        const newTypesContent = typesContent.replace(
          stackParamListRegex,
          `${beforeClosing}  Subscription: undefined;`
        );
        fs.writeFileSync(navigationTypesPath, newTypesContent);
        console.log('✅ Added Subscription to navigation types');
      }
    } else {
      console.log('⚠️  Could not find RootStackParamList in types.ts');
      console.log('   Please manually add: Subscription: undefined;');
    }
  } else {
    console.log('✅ Subscription already exists in navigation types');
  }
} else {
  console.log('⚠️  Navigation types file not found at src/navigation/types.ts');
}

// Check for main navigator file
const navigatorPaths = [
  'src/navigation/AppNavigator.tsx',
  'src/navigation/RootStackNavigator.tsx',
  'navigation/AppNavigator.tsx'
];

let navigatorPath = null;
for (const path of navigatorPaths) {
  if (fs.existsSync(path)) {
    navigatorPath = path;
    break;
  }
}

if (navigatorPath) {
  console.log(`📝 Updating navigator file: ${navigatorPath}`);
  
  let navigatorContent = fs.readFileSync(navigatorPath, 'utf8');
  
  // Add import if not present
  if (!navigatorContent.includes("import SubscriptionScreen from '../screens/SubscriptionScreen'")) {
    // Find other screen imports
    const importRegex = /import\s+\w+\s+from\s+['"]\.\.\/screens\/\w+['"];?/g;
    const imports = navigatorContent.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const importIndex = navigatorContent.lastIndexOf(lastImport);
      const insertIndex = importIndex + lastImport.length;
      
      const subscriptionImport = `\nimport SubscriptionScreen from '../screens/SubscriptionScreen';`;
      navigatorContent = navigatorContent.slice(0, insertIndex) + subscriptionImport + navigatorContent.slice(insertIndex);
      console.log('✅ Added SubscriptionScreen import');
    }
  }
  
  // Add Screen component if not present
  if (!navigatorContent.includes('<Stack.Screen') || !navigatorContent.includes('name="Subscription"')) {
    // Find other Stack.Screen components
    const screenRegex = /<Stack\.Screen[\s\S]*?\/>/g;
    const screens = navigatorContent.match(screenRegex);
    
    if (screens && screens.length > 0) {
      const lastScreen = screens[screens.length - 1];
      const screenIndex = navigatorContent.lastIndexOf(lastScreen);
      const insertIndex = screenIndex + lastScreen.length;
      
      const subscriptionScreen = `
        <Stack.Screen 
          name="Subscription" 
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />`;
      
      navigatorContent = navigatorContent.slice(0, insertIndex) + subscriptionScreen + navigatorContent.slice(insertIndex);
      console.log('✅ Added Subscription screen to navigator');
    }
  } else {
    console.log('✅ Subscription screen already exists in navigator');
  }
  
  fs.writeFileSync(navigatorPath, navigatorContent);
} else {
  console.log('⚠️  Could not find main navigator file');
  console.log('   Please manually add the subscription screen to your navigator');
}

console.log('\n🎉 In-App Purchase Subscription System Installation Complete!\n');

console.log('📋 Next Steps:');
console.log('1. Update product IDs in src/lib/inAppPurchaseService.ts');
console.log('2. Set up products in App Store Connect & Google Play Console');
console.log('3. Add subscription screen to your app navigation if not done automatically');
console.log('4. Test the implementation using sandbox accounts');
console.log('5. Implement server-side receipt verification for production');

console.log('\n📖 For detailed instructions, see: IN-APP-PURCHASE-IMPLEMENTATION.md\n');

console.log('💡 Example usage:');
console.log('');
console.log('// Navigate to subscription screen');
console.log('navigation.navigate("Subscription");');
console.log('');
console.log('// Check subscription status');
console.log('import { useSubscription } from "./src/hooks/useSubscription";');
console.log('const { isPremiumUser } = useSubscription();');
console.log('');
console.log('// Add upgrade button');
console.log('import PremiumUpgradeButton from "./src/components/PremiumUpgradeButton";');
console.log('<PremiumUpgradeButton onPress={() => navigation.navigate("Subscription")} />');

console.log('\n✨ Happy coding!');
