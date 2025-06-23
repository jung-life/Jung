# In-App Purchase Implementation for Jung App

This document explains the complete in-app purchase and subscription system implementation for your Jung app.

## Overview

I've implemented a comprehensive in-app purchase system that includes:

- **Subscription Management**: Weekly, Monthly, and Yearly premium subscriptions
- **Purchase Service**: Robust service handling all IAP operations
- **Subscription Hook**: Easy-to-use React hook for subscription status
- **UI Components**: Beautiful subscription screen and upgrade buttons
- **Error Handling**: Comprehensive error handling and user feedback

## Files Created

### Core Service Layer
- `src/lib/inAppPurchaseService.ts` - Main service for handling all IAP operations
- `src/hooks/useSubscription.ts` - React hook for subscription status management

### UI Components
- `src/screens/SubscriptionScreen.tsx` - Main subscription/pricing screen
- `src/components/PremiumUpgradeButton.tsx` - Reusable upgrade button component

## Product IDs Configuration

Update the product IDs in `src/lib/inAppPurchaseService.ts` with your actual product IDs from App Store Connect and Google Play Console:

```typescript
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'com.jung.premium.monthly',     // Replace with your actual product ID
  YEARLY: 'com.jung.premium.yearly',       // Replace with your actual product ID
  WEEKLY: 'com.jung.premium.weekly',       // Replace with your actual product ID
};

export const CONSUMABLE_PRODUCTS = {
  PREMIUM_SESSIONS: 'com.jung.sessions.premium',   // Replace with your actual product ID
  UNLOCK_AVATARS: 'com.jung.avatars.unlock',       // Replace with your actual product ID
};
```

## Setting Up App Store Connect / Google Play Console

### Apple App Store Connect
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create subscription groups and add subscriptions:
   - Weekly Premium: $2.99/week
   - Monthly Premium: $9.99/month (set as popular)
   - Yearly Premium: $79.99/year (33% savings)
3. Set up subscription pricing for different regions
4. Configure subscription benefits and features

### Google Play Console
1. Go to Play Console → Your App → Monetize → Products → Subscriptions
2. Create the same subscription products with matching product IDs
3. Set pricing and configure subscription details
4. Enable subscription benefits

## Navigation Setup

Add the subscription screen to your navigation. Here's how to integrate it:

### 1. Add to Navigation Types
Update `src/navigation/types.ts`:

```typescript
export type RootStackParamList = {
  // ... existing screens
  Subscription: undefined;
  // ... other screens
};
```

### 2. Add to Navigator
Update your main navigator (e.g., `src/navigation/AppNavigator.tsx`):

```typescript
import SubscriptionScreen from '../screens/SubscriptionScreen';

// Inside your Navigator
<Stack.Screen 
  name="Subscription" 
  component={SubscriptionScreen}
  options={{ headerShown: false }}
/>
```

## Usage Examples

### 1. Using the Subscription Hook

```typescript
import { useSubscription } from '../hooks/useSubscription';

const MyComponent = () => {
  const { 
    isPremiumUser, 
    subscriptionStatus, 
    loading, 
    checkSubscriptionStatus 
  } = useSubscription();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {isPremiumUser ? (
        <Text>Welcome Premium User!</Text>
      ) : (
        <Text>Upgrade to Premium for more features</Text>
      )}
    </View>
  );
};
```

### 2. Adding Premium Upgrade Buttons

```typescript
import PremiumUpgradeButton from '../components/PremiumUpgradeButton';

const MyScreen = ({ navigation }) => {
  const handleUpgradePress = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View>
      {/* Small button */}
      <PremiumUpgradeButton 
        variant="small"
        onPress={handleUpgradePress}
        message="Go Premium"
      />

      {/* Medium button (default) */}
      <PremiumUpgradeButton 
        onPress={handleUpgradePress}
      />

      {/* Large button */}
      <PremiumUpgradeButton 
        variant="large"
        onPress={handleUpgradePress}
        message="Unlock All Features"
      />
    </View>
  );
};
```

### 3. Protecting Premium Features

```typescript
import { useSubscription } from '../hooks/useSubscription';

const PremiumFeatureScreen = ({ navigation }) => {
  const { isPremiumUser } = useSubscription();

  if (!isPremiumUser) {
    return (
      <View style={styles.upgradePrompt}>
        <Text>This feature requires Premium</Text>
        <PremiumUpgradeButton 
          onPress={() => navigation.navigate('Subscription')}
          message="Upgrade Now"
        />
      </View>
    );
  }

  return (
    <View>
      {/* Premium feature content */}
    </View>
  );
};
```

### 4. Avatar Selector with Premium Features

```typescript
const AvatarSelector = ({ navigation }) => {
  const { isPremiumUser } = useSubscription();

  const avatars = [
    { id: 1, name: 'Carl Rogers', premium: false },
    { id: 2, name: 'Carl Jung', premium: true },
    { id: 3, name: 'Sigmund Freud', premium: true },
  ];

  const handleAvatarSelect = (avatar) => {
    if (avatar.premium && !isPremiumUser) {
      navigation.navigate('Subscription');
      return;
    }
    
    // Select avatar
    selectAvatar(avatar);
  };

  return (
    <View>
      {avatars.map(avatar => (
        <TouchableOpacity 
          key={avatar.id}
          onPress={() => handleAvatarSelect(avatar)}
          style={styles.avatarCard}
        >
          <Text>{avatar.name}</Text>
          {avatar.premium && !isPremiumUser && (
            <Text style={styles.premiumBadge}>👑 Premium</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

## Backend Integration (Recommended)

For production, implement server-side receipt verification:

### 1. Purchase Verification Endpoint

```typescript
// In src/lib/inAppPurchaseService.ts
private async verifyPurchaseWithBackend(purchase: Purchase): Promise<void> {
  try {
    const response = await fetch('YOUR_API_ENDPOINT/verify-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      throw new Error('Purchase verification failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Backend verification failed:', error);
    throw error;
  }
}
```

### 2. Supabase Integration

Add subscription tracking to your Supabase database:

```sql
-- Add to your Supabase schema
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios' or 'android'
  purchase_token TEXT,
  transaction_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing

### 1. Sandbox Testing (iOS)
1. Create sandbox test users in App Store Connect
2. Sign out of App Store on device
3. Test purchases will use sandbox environment

### 2. Google Play Testing
1. Upload app to internal testing track
2. Add test users to internal testing group
3. Test purchases using test accounts

### 3. Development Testing

```typescript
// Add to your development builds for testing
const isDevelopment = __DEV__;

if (isDevelopment) {
  // Mock subscription status for testing
  const mockSubscriptionStatus = {
    isActive: true,
    productId: 'com.jung.premium.monthly',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isInGracePeriod: false,
    isInTrialPeriod: false,
  };
}
```

## Error Handling

The implementation includes comprehensive error handling:

- **Network errors**: Graceful fallback and retry logic
- **Purchase cancellation**: User-friendly messaging
- **Invalid products**: Fallback to default pricing
- **Receipt validation**: Secure server-side verification
- **Restore purchases**: Cross-device subscription restoration

## Security Considerations

1. **Receipt Validation**: Always validate receipts server-side
2. **Product IDs**: Keep product IDs secure and don't expose sensitive logic
3. **User Authentication**: Tie subscriptions to authenticated users
4. **Offline Support**: Cache subscription status for offline usage
5. **Fraud Prevention**: Implement server-side validation and monitoring

## App Store Submission

### Required Info.plist entries (iOS):
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### Required permissions (Android):
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

## Next Steps

1. **Update Product IDs**: Replace placeholder product IDs with your actual ones
2. **Add to Navigation**: Integrate the subscription screen into your app navigation
3. **Implement Backend**: Set up server-side receipt verification
4. **Test Thoroughly**: Test on both iOS and Android platforms
5. **Monitor Analytics**: Track subscription conversion rates and user behavior

## Support

For additional help with in-app purchases:
- Apple: [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)
- Google: [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- React Native IAP: [Library Documentation](https://github.com/dooboolab/react-native-iap)

The implementation is now ready for integration and testing!
