# Complete Apple Sign In Integration Guide for React Native (Expo)

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Apple Developer Console Setup](#apple-developer-console-setup)
3. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
4. [Project Configuration](#project-configuration)
5. [Code Implementation](#code-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Tools
- **Apple Developer Account** (Paid - $99/year)
- **Xcode** (Latest version recommended)
- **Expo CLI** or **Expo Go** app
- **Node.js** (Version 16 or higher)
- **iOS Device or Simulator** (iOS 13+ for Sign In with Apple)

### Existing Setup Analysis
Based on your current project structure, you already have:
✅ `expo-apple-authentication` package installed  
✅ Apple Sign In UI implemented in `LoginScreen.tsx`  
✅ Supabase integration configured  
✅ Authentication context set up  

---

## Apple Developer Console Setup

### Step 1: Create App ID and Enable Sign In with Apple

#### 1.1 Access Apple Developer Console
- Open [Apple Developer Console](https://developer.apple.com/account/)
- Sign in with your Apple Developer Account
- Navigate to **"Certificates, Identifiers & Profiles"**

![Apple Developer Console - Main Dashboard]
**Screenshot Description:** The main Apple Developer Console showing the sidebar with "Certificates, Identifiers & Profiles" highlighted.

#### 1.2 Create or Configure App ID
- Click **"Identifiers"** in the sidebar
- Click the **"+"** button to create a new identifier
- Select **"App IDs"** and click **"Continue"**

![App ID Creation Screen]
**Screenshot Description:** App ID creation screen with "App IDs" option selected and Continue button highlighted.

#### 1.3 Configure App ID Details
- **Description:** Enter a meaningful name (e.g., "Jung AI App")
- **Bundle ID:** Use your existing bundle ID: `com.yourcompany.jung`
- **Platform:** Select **"iOS, tvOS, watchOS"**

![App ID Configuration]
**Screenshot Description:** App ID configuration form showing Description field filled with "Jung AI App" and Bundle ID field with "com.yourcompany.jung".

#### 1.4 Enable Sign In with Apple Capability
- Scroll down to **"Capabilities"** section
- Find **"Sign In with Apple"** and check the box
- Click **"Continue"** then **"Register"**

![Capabilities Selection]
**Screenshot Description:** Capabilities list with "Sign In with Apple" checkbox highlighted and checked.

### Step 2: Configure Sign In with Apple Service

#### 2.1 Create Service ID (for Web/Supabase)
- In the sidebar, click **"Identifiers"** again
- Click **"+"** and select **"Services IDs"**
- Click **"Continue"**

![Service ID Creation]
**Screenshot Description:** Identifier type selection with "Services IDs" option highlighted.

#### 2.2 Service ID Configuration
- **Description:** "Jung AI Web Service"
- **Identifier:** `com.yourcompany.jung.web` (must be different from App ID)
- Check **"Sign In with Apple"**
- Click **"Configure"** next to "Sign In with Apple"

![Service ID Details]
**Screenshot Description:** Service ID configuration form with description and identifier fields filled, and "Sign In with Apple" checkbox checked.

#### 2.3 Configure Web Authentication
In the Sign In with Apple configuration popup:
- **Primary App ID:** Select your app ID (`com.yourcompany.jung`)
- **Web Domain:** Your Supabase project domain (e.g., `your-project.supabase.co`)
- **Return URLs:** Add your Supabase callback URL:
  ```
  https://your-project.supabase.co/auth/v1/callback
  ```

![Web Authentication Configuration]
**Screenshot Description:** Sign In with Apple configuration dialog showing Primary App ID dropdown, Web Domain field, and Return URLs section.

#### 2.4 Create Private Key
- Navigate to **"Keys"** in the sidebar
- Click **"+"** to create a new key
- **Key Name:** "Apple Sign In Key"
- Check **"Sign In with Apple"**
- Click **"Configure"** and select your Primary App ID
- Click **"Save"** then **"Continue"** and **"Register"**

![Key Creation]
**Screenshot Description:** Key registration form with "Sign In with Apple" capability selected and configuration button highlighted.

#### 2.5 Download and Save Key
- **IMPORTANT:** Download the `.p8` file immediately
- Note the **Key ID** (10-character string)
- Note your **Team ID** (found in top-right corner of developer console)

![Key Download]
**Screenshot Description:** Key details page showing the Key ID and download button for the .p8 file.

---

## Supabase Dashboard Configuration

### Step 3: Configure Apple Provider in Supabase

#### 3.1 Access Supabase Dashboard
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Navigate to **"Authentication" → "Providers"**

![Supabase Dashboard]
**Screenshot Description:** Supabase dashboard sidebar with Authentication section expanded and Providers highlighted.

#### 3.2 Enable Apple Provider
- Find **"Apple"** in the provider list
- Toggle **"Enable sign in with Apple"** to ON

![Apple Provider Toggle]
**Screenshot Description:** Apple provider configuration page with the enable toggle switched to ON.

#### 3.3 Configure Apple Provider Settings
Fill in the following fields with values from Apple Developer Console:

```
Service ID: com.yourcompany.jung.web
Team ID: [Your 10-character Team ID]
Key ID: [Your 10-character Key ID]
Private Key: [Contents of your .p8 file]
```

![Apple Provider Configuration]
**Screenshot Description:** Apple provider configuration form with all fields filled in, showing Service ID, Team ID, Key ID, and Private Key text area.

#### 3.4 Configure Redirect URL
- **Site URL:** Your app's URL scheme: `jung://`
- **Redirect URLs:** Add both:
  ```
  jung://auth/callback
  https://your-project.supabase.co/auth/v1/callback
  ```

![Redirect URLs Configuration]
**Screenshot Description:** Redirect URLs section showing both the app scheme and Supabase callback URLs added.

---

## Project Configuration

### Step 4: Update App Configuration

#### 4.1 Update app.json (Already Configured)
Your current `app.json` is mostly correct, but ensure these settings:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.jung",
      "associatedDomains": [
        "applinks:your-project.supabase.co"
      ]
    },
    "scheme": "jung",
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

#### 4.2 Add Apple Authentication Plugin
If not already added, install the plugin:

```bash
expo install expo-apple-authentication
```

Add to your `app.json` plugins array:
```json
"plugins": [
  "expo-apple-authentication"
]
```

### Step 5: iOS Entitlements

#### 5.1 Add Sign In with Apple Entitlement
Create or update `ios/jung/jung.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.applesignin</key>
    <array>
        <string>Default</string>
    </array>
</dict>
</plist>
```

#### 5.2 Update Xcode Project (For EAS Build)
In your `eas.json`, ensure proper configuration:

```json
{
  "build": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.jung"
    }
  }
}
```

---

## Code Implementation

### Step 6: Implementation Analysis

Your current implementation in `LoginScreen.tsx` is already well-structured. Here's the breakdown:

#### 6.1 Current Apple Sign In Handler
```typescript
const handleAppleLogin = async () => {
  try {
    setLoading(true);
    console.log('Starting Apple login flow...');

    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Error', 'Apple Sign In is not available on this device.');
      setLoading(false);
      return;
    }

    // Generate a random nonce for security
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    console.log('Apple credential received:', credential);

    if (credential.identityToken) {
      // Sign in with Supabase using Apple credentials
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) {
        console.error('Supabase Apple auth error:', error);
        Alert.alert('Login Error', error.message);
        return;
      }

      console.log('Apple authentication successful:', data);

      // Store session data if available
      if (data.session) {
        await storeAuthData(data.session);
        console.log('Apple login completed successfully');
        
        // Navigate to appropriate screen
        navigation.reset({ 
          index: 0, 
          routes: [{ name: 'PostLoginScreen' }] 
        });
      }
    } else {
      Alert.alert('Error', 'Failed to get identity token from Apple.');
    }
  } catch (error: any) {
    console.error('Apple login error:', error);
    
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User canceled the Apple Sign In flow
      console.log('User canceled Apple Sign In');
    } else {
      Alert.alert('Error', 'An error occurred during Apple login: ' + error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

#### 6.2 UI Implementation (SocialButton.tsx)
Your `SocialButton` component correctly implements Apple's design guidelines:

```typescript
case 'apple':
  return (
    <>
      <AppleLogo size={22} color="#FFFFFF" weight="fill" style={tw`mr-3`} />
      <Text style={tw`font-medium text-base text-white`}>Sign in with Apple</Text>
    </>
  );

// Apple button styling (follows Apple guidelines)
const getButtonStyle = () => {
  if (provider === 'apple') {
    return tw`bg-black rounded-xl py-3.5 px-4 mb-3 shadow-sm flex-row items-center justify-center ${disabled ? 'opacity-60' : ''}`;
  }
  // ... other providers
};
```

### Step 7: Enhanced AuthContext Integration

Your `AuthContext.tsx` should be updated to handle Apple Sign In properly. Add this function:

```typescript
// Add this to your AuthContext.tsx
const signInWithApple = async () => {
  try {
    setLoading(true);
    
    // Check availability
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device.');
    }

    // Generate nonce
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('Failed to get identity token from Apple.');
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce,
    });

    if (error) throw error;

    if (data?.user) {
      updateUserState(data.user);
      
      if (data.session) {
        await storeAuthData(data.session);
      }
      
      // Ensure user preferences
      await ensureUserPreferences();
      
      // Check disclaimer status
      const hasSeenDisclaimer = await checkDisclaimerStatusDirect();
      setIsNewUser(!hasSeenDisclaimer);

      // Identify with RevenueCat
      try {
        await revenueCatService.identifyUser(data.user.id);
      } catch (revenueCatError) {
        console.error('Failed to identify user with RevenueCat:', revenueCatError);
      }
      
      return { success: true, isNewUser: !hasSeenDisclaimer };
    }
    
    return { success: false };
  } catch (error: unknown) {
    console.error('Error signing in with Apple:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during Apple sign in';
    return { 
      success: false, 
      error: errorMessage 
    };
  } finally {
    setLoading(false);
  }
};
```

---

## Testing

### Step 8: Testing Apple Sign In

#### 8.1 Simulator Testing
**Note:** Apple Sign In requires a real device for full testing. In iOS Simulator:
- The Sign In button will appear
- Tapping it may show an error about Apple ID not being available
- This is expected behavior in simulator

#### 8.2 Device Testing Prerequisites
- iOS device with iOS 13 or later
- Device signed into iCloud with an Apple ID
- Two-factor authentication enabled on the Apple ID

#### 8.3 Testing Steps

1. **Build and Install on Device:**
   ```bash
   # For development build
   expo run:ios --device

   # For EAS build
   eas build --platform ios --profile development
   ```

2. **Test Apple Sign In Flow:**
   - Open the app on your iOS device
   - Navigate to the login screen
   - Tap "Sign in with Apple"
   - You should see the Apple authentication modal

![Apple Sign In Modal]
**Screenshot Description:** iOS Apple Sign In modal showing user's Apple ID, with options to "Continue with Apple ID" or "Cancel".

3. **Verify Authentication:**
   - Complete the Apple Sign In process
   - Check that the user is successfully authenticated
   - Verify navigation to the post-login screen
   - Check console logs for successful authentication

#### 8.4 Common Testing Scenarios

**First-time Sign In:**
- User sees Apple Sign In modal
- User can choose to share or hide email
- User can edit the display name
- Authentication completes successfully

**Returning User:**
- User sees simplified Apple Sign In prompt
- Authentication is faster (no email/name selection)
- User is signed in immediately

**Cancel Scenario:**
- User taps "Cancel" in Apple modal
- App handles cancellation gracefully
- No error alerts shown for user cancellation

---

## Troubleshooting

### Step 9: Common Issues and Solutions

#### 9.1 "Apple Sign In is not available"
**Cause:** Device doesn't support Apple Sign In or isn't signed into iCloud
**Solution:**
- Ensure iOS 13+ on device
- Sign into iCloud on device
- Enable two-factor authentication

#### 9.2 "Invalid client_id" Error
**Cause:** Mismatch between Service ID and Supabase configuration
**Solution:**
- Verify Service ID in Apple Developer Console matches Supabase
- Check that Service ID is different from Bundle ID
- Ensure Service ID has Sign In with Apple enabled

#### 9.3 "Invalid redirect_uri" Error
**Cause:** Redirect URL mismatch
**Solution:**
- Verify redirect URLs in Apple Developer Console
- Ensure Supabase callback URL is correctly configured
- Check that domain verification is complete

#### 9.4 Token Verification Failures
**Cause:** Private key or configuration issues
**Solution:**
- Re-download private key from Apple Developer Console
- Verify Key ID and Team ID are correct
- Ensure private key is properly formatted in Supabase

#### 9.5 Development vs Production Issues
**Common Issue:** Works in development but fails in production
**Solution:**
- Ensure production bundle ID matches Apple Developer Console
- Verify entitlements are properly configured
- Check EAS build configuration

### Step 10: Debug Logging

Add comprehensive logging to track authentication flow:

```typescript
const handleAppleLogin = async () => {
  console.log('🍎 Starting Apple Sign In flow');
  
  try {
    // Log availability check
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('🍎 Apple Sign In available:', isAvailable);
    
    if (!isAvailable) {
      console.log('🍎 Apple Sign In not available - device/OS issue');
      return;
    }

    // Log nonce generation
    const nonce = Math.random().toString(36).substring(2, 10);
    console.log('🍎 Generated nonce:', nonce);
    
    // Log authentication request
    console.log('🍎 Requesting Apple authentication...');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    console.log('🍎 Apple credential received:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
      hasIdentityToken: !!credential.identityToken,
      hasAuthorizationCode: !!credential.authorizationCode
    });

    // Log Supabase authentication
    console.log('🍎 Authenticating with Supabase...');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce,
    });

    if (error) {
      console.error('🍎 Supabase authentication failed:', error);
      return;
    }

    console.log('🍎 Supabase authentication successful:', {
      userId: data?.user?.id,
      hasSession: !!data?.session
    });

  } catch (error) {
    console.error('🍎 Apple Sign In error:', error);
  }
};
```

---

## Production Deployment

### Step 11: Production Checklist

#### 11.1 Apple Developer Console
- [ ] App ID configured with correct Bundle ID
- [ ] Service ID configured with production domains
- [ ] Private key generated and downloaded
- [ ] All redirect URLs updated for production

#### 11.2 Supabase Configuration
- [ ] Apple provider configured with production values
- [ ] Redirect URLs updated for production domain
- [ ] Service ID matches production configuration

#### 11.3 App Configuration
- [ ] Bundle ID matches Apple Developer Console
- [ ] Entitlements file included in build
- [ ] Production certificates configured

#### 11.4 EAS Build Configuration
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourcompany.jung",
        "buildConfiguration": "Release"
      }
    }
  }
}
```

#### 11.5 App Store Submission
- [ ] Apple Sign In capability enabled in Xcode
- [ ] Privacy Policy updated to mention Apple Sign In
- [ ] App Review Guidelines compliance checked
- [ ] Test on multiple devices before submission

### Step 12: Monitoring and Analytics

#### 12.1 Success Metrics
Track these metrics for Apple Sign In:
- Sign In attempt rate
- Success rate
- Error types and frequency
- User retention after Apple Sign In

#### 12.2 Error Monitoring
Implement error tracking for:
- Authentication failures
- Token verification issues
- Network connectivity problems
- User cancellations vs. actual errors

---

## Security Best Practices

### Step 13: Security Considerations

#### 13.1 Nonce Security
- Always generate unique nonces
- Use cryptographically secure random generation
- Hash nonces before sending to Apple

#### 13.2 Token Handling
- Never log identity tokens in production
- Verify tokens server-side (Supabase handles this)
- Implement proper session management

#### 13.3 User Data Privacy
- Follow Apple's guidelines for user data handling
- Respect user's choice to hide email
- Implement proper data retention policies

---

## Conclusion

Your Apple Sign In integration is already well-implemented! The main areas to focus on are:

1. **Apple Developer Console Configuration** - Ensure all certificates and identifiers are properly set up
2. **Supabase Provider Configuration** - Verify all the Apple credentials are correctly entered
3. **Testing on Real Device** - Apple Sign In requires physical iOS device testing
4. **Production Deployment** - Ensure all configurations match between development and production

Your current code implementation follows best practices and Apple's guidelines. The integration should work seamlessly once the developer console and Supabase configurations are properly set up.

---

## Quick Reference

### Essential URLs
- Apple Developer Console: https://developer.apple.com/account/
- Supabase Dashboard: https://supabase.com/dashboard
- Apple Sign In Guidelines: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple

### Key Files in Your Project
- `src/screens/LoginScreen.tsx` - Main implementation
- `src/components/SocialButton.tsx` - UI component
- `src/contexts/AuthContext.tsx` - Authentication state management
- `app.json` - Expo configuration
- `ios/jung/jung.entitlements` - iOS entitlements

### Support Commands
```bash
# Install dependencies
expo install expo-apple-authentication expo-crypto

# Build for iOS device
expo run:ios --device

# EAS build
eas build --platform ios --profile development
