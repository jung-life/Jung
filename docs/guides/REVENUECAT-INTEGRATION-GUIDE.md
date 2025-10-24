# RevenueCat Integration Guide for Jung App

This guide will help you complete the RevenueCat integration for your Jung app. The code has been integrated, but you need to configure RevenueCat dashboard and update API keys.

## ✅ What's Already Done

1. **Packages Installed**: `react-native-purchases` and `react-native-purchases-ui` have been installed
2. **Service Layer**: `src/lib/revenueCatService.ts` - Complete RevenueCat service with all necessary methods
3. **React Hook**: `src/hooks/useRevenueCat.ts` - Easy-to-use hook for subscription management
4. **Paywall Component**: `src/components/RevenueCatPaywall.tsx` - Ready-to-use paywall UI
5. **App Integration**: RevenueCat is initialized in the main app and integrated with authentication
6. **User Management**: Users are automatically identified with RevenueCat on login and logged out on app logout

## 🔧 Required Setup Steps

### 1. RevenueCat Dashboard Configuration

1. **Create a RevenueCat Account**
   - Go to [https://www.revenuecat.com/](https://www.revenuecat.com/)
   - Sign up for a free account

2. **Create a New Project**
   - Click "Create Project"
   - Enter your project name (e.g., "Jung App")

3. **Connect to App Stores**
   - **For iOS**: Connect to App Store Connect
     - Go to "Project Settings" > "Integrations"
     - Add your App Store Connect credentials
   - **For Android**: Connect to Google Play Console
     - Upload your Google Play service account key

4. **Add Products**
   - Go to "Products" in the dashboard
   - Add your subscription products (e.g., monthly, annual plans)
   - Configure pricing for each store

5. **Create Entitlements**
   - Go to "Entitlements"
   - Create an entitlement (e.g., "premium")
   - Attach your products to this entitlement

6. **Create Offerings**
   - Go to "Offerings"
   - Create an offering (collection of products shown on paywall)
   - Add your products to the offering

7. **Get API Keys**
   - Go to "Project Settings" > "API Keys"
   - Copy the Apple App Store API key and Google Play Store API key

### 2. Update API Keys in Your Environment

Update the API keys in your `.env` file:

```bash
# RevenueCat API Keys (Replace with your actual keys from RevenueCat dashboard)
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY='appl_your_apple_api_key_here'
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY='goog_your_google_api_key_here'
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID='premium'
```

The API keys are automatically loaded from environment variables in the RevenueCat service for better security.

### 3. Configure App Store Products (iOS)

In App Store Connect:
1. Create your in-app purchase products
2. Make sure product IDs match what you configured in RevenueCat
3. Submit for review (required for testing with real purchases)

### 4. Configure Google Play Products (Android)

In Google Play Console:
1. Create your subscription products
2. Make sure product IDs match what you configured in RevenueCat
3. Activate the products

### 5. Build Configuration

Since you're using Expo with development builds, you need to create a new development build to include the RevenueCat native dependencies:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

## 📱 How to Use RevenueCat in Your App

### Check Subscription Status

```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

function MyComponent() {
  const { isSubscribed, isLoading } = useRevenueCat();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isSubscribed) {
    return <PremiumContent />;
  } else {
    return <PaywallOrLimitedContent />;
  }
}
```

### Present a Paywall

```typescript
import { RevenueCatPaywall } from '../components/RevenueCatPaywall';

function SubscriptionScreen() {
  return (
    <RevenueCatPaywall
      title="Unlock Premium Features"
      subtitle="Get unlimited access to all Jung app features"
      onPurchaseSuccess={() => {
        // Handle successful purchase
        navigation.goBack();
      }}
      onClose={() => {
        // Handle paywall close
        navigation.goBack();
      }}
    />
  );
}
```

### Protect Premium Features

```typescript
import { useRevenueCat } from '../hooks/useRevenueCat';

function PremiumFeatureComponent() {
  const { isSubscribed } = useRevenueCat();
  
  if (!isSubscribed) {
    return (
      <View>
        <Text>This is a premium feature</Text>
        <Button title="Upgrade" onPress={() => showPaywall()} />
      </View>
    );
  }
  
  return <PremiumFeatureContent />;
}
```

## 🧪 Testing

### Sandbox Testing (iOS)

1. Create sandbox test accounts in App Store Connect
2. Sign out of your Apple ID in Settings > App Store
3. Install your development build
4. When prompted, sign in with your sandbox account
5. Test purchases (they'll be free in sandbox)

### Test Purchases (Android)

1. Add test accounts in Google Play Console
2. Install your development build
3. Make sure you're signed in with a test account
4. Test purchases

## 🔗 Navigation Integration

Add the paywall to your navigation stack. You already have a `Subscription` screen in your navigation, so you can update it:

```typescript
// In your SubscriptionScreen component
import { RevenueCatPaywall } from '../components/RevenueCatPaywall';

export default function SubscriptionScreen({ navigation }) {
  return (
    <RevenueCatPaywall
      onPurchaseSuccess={() => navigation.goBack()}
      onClose={() => navigation.goBack()}
    />
  );
}
```

## 🛡️ Best Practices

1. **Always Check Subscription Status**: Before showing premium content
2. **Handle Errors Gracefully**: Network issues, purchase failures, etc.
3. **Provide Restore Option**: For users who reinstall the app
4. **Test Thoroughly**: Both sandbox and production environments
5. **Monitor Analytics**: Use RevenueCat dashboard to track metrics

## 🐛 Common Issues & Solutions

### Issue: "Invariant Violation: new NativeEventEmitter() requires a non-null argument"
**Solution**: This happens when testing in Expo Go. You need to use a development build.

### Issue: No products found
**Solution**: 
- Verify products are created and active in app stores
- Check RevenueCat product configuration
- Ensure API keys are correct

### Issue: Purchase fails
**Solution**:
- Check sandbox vs production environment
- Verify test accounts are set up correctly
- Check app store product status

## 📞 Support

- RevenueCat Documentation: https://docs.revenuecat.com/
- RevenueCat Community: https://community.revenuecat.com/
- Your implementation is in these files:
  - `src/lib/revenueCatService.ts`
  - `src/hooks/useRevenueCat.ts` 
  - `src/components/RevenueCatPaywall.tsx`

## 🎉 Next Steps

1. Complete the RevenueCat dashboard setup
2. Update API keys in the code
3. Create a new development build
4. Test the integration
5. Set up production environment when ready to launch

Your RevenueCat integration is now complete! Just follow the setup steps above to get it fully operational.
