# Apple Sign In Error Fix Guide

## Error Analysis
You're encountering these specific errors:
```
ERROR  Apple login error: [Error: The authorization attempt failed for an unknown reason]
[AuthKit] Authorization failed: Error Domain=AKAuthenticationError Code=-7026 "(null)"
UserInfo={AKClientBundleID=org.name.jung}
[AuthenticationServices] ASAuthorizationController credential request failed with error: Error
Domain=com.apple.AuthenticationServices.AuthorizationError Code=1000 "(null)"
```

## Root Cause
The error shows `AKClientBundleID=org.name.jung` but your app.json shows `com.yourcompany.jung`. This mismatch is the primary issue.

## Quick Fixes

### Fix 1: Bundle Identifier Mismatch
The most critical issue is the bundle identifier mismatch:
- **Error shows:** `org.name.jung`
- **Your app.json has:** `com.yourcompany.jung`

### Fix 2: Apple Developer Console Configuration
This error typically occurs when:
1. App ID doesn't exist in Apple Developer Console
2. Sign In with Apple capability is not enabled
3. Bundle ID mismatch between code and Apple Developer Console

### Fix 3: Device/Simulator Issues
- Apple Sign In doesn't work in iOS Simulator
- Device must be signed into iCloud
- Device must have 2FA enabled

## Step-by-Step Resolution

### Step 1: Fix Bundle Identifier
Update your app.json to match what's actually being used:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "org.name.jung"
    }
  }
}
```

### Step 2: Apple Developer Console Setup
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers**
4. Create new App ID with:
   - **Bundle ID:** `org.name.jung`
   - **Capabilities:** Enable "Sign In with Apple"

### Step 3: Create Service ID (for Supabase)
1. Create new Service ID with identifier: `org.name.jung.web`
2. Enable "Sign In with Apple"
3. Configure with your Supabase domain

### Step 4: Generate Private Key
1. Go to **Keys** section
2. Create new key with "Sign In with Apple" capability
3. Download the .p8 file
4. Note the Key ID and Team ID

### Step 5: Update Supabase Configuration
In Supabase Authentication > Providers > Apple:
- **Service ID:** `org.name.jung.web`
- **Team ID:** [Your Team ID from Apple]
- **Key ID:** [Your Key ID from Apple]
- **Private Key:** [Contents of .p8 file]

## Testing Checklist

### Prerequisites
- [ ] Real iOS device (not simulator)
- [ ] iOS 13 or later
- [ ] Device signed into iCloud
- [ ] Two-factor authentication enabled on Apple ID
- [ ] Valid Apple Developer Account ($99/year)

### Configuration Check
- [ ] Bundle ID matches in app.json and Apple Developer Console
- [ ] App ID has "Sign In with Apple" capability enabled
- [ ] Service ID is different from App ID
- [ ] Private key is correctly configured in Supabase
- [ ] Redirect URLs are properly set

### Build and Test
```bash
# Clean build
expo prebuild --clean

# Build for device
expo run:ios --device
```

## Common Error Codes

### Error Code -7026 (AKAuthenticationError)
- **Cause:** Bundle ID not configured in Apple Developer Console
- **Fix:** Create App ID with correct bundle identifier

### Error Code 1000 (AuthorizationError)
- **Cause:** Sign In with Apple capability not enabled
- **Fix:** Enable capability in Apple Developer Console

### Error Code 1001
- **Cause:** User cancelled the request
- **Fix:** This is normal user behavior

### Error Code 1004
- **Cause:** Request failed
- **Fix:** Check network connection and Apple services status

## Quick Debug Script

Add this enhanced error logging to your Apple login handler:

```typescript
const handleAppleLogin = async () => {
  try {
    console.log('🍎 Bundle ID Check:', Constants.expoConfig?.ios?.bundleIdentifier);
    
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('🍎 Apple Sign In available:', isAvailable);
    
    if (!isAvailable) {
      Alert.alert('Apple Sign In Not Available', 
        'Please ensure you are on a real iOS device (not simulator) and signed into iCloud.');
      return;
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('🍎 Apple credential:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
    });

  } catch (error: any) {
    console.error('🍎 Detailed Apple error:', {
      code: error.code,
      message: error.message,
      domain: error.domain,
      userInfo: error.userInfo,
    });
    
    if (error.code === 'ERR_REQUEST_CANCELED') {
      console.log('🍎 User cancelled Apple Sign In');
      return;
    }
    
    Alert.alert('Apple Sign In Error', 
      `Error ${error.code}: Please ensure your app is properly configured in Apple Developer Console.`);
  }
};
```

## Next Steps

1. **Immediate Fix:** Update bundle identifier to match the error message (`org.name.jung`)
2. **Apple Console:** Create App ID with the correct bundle identifier
3. **Rebuild:** Clean rebuild your app after configuration changes
4. **Test:** Test on real iOS device only

The error you're seeing is very common and typically resolves once the bundle identifier configuration is aligned between your app and Apple Developer Console.
