# Apple Sign-In Authorization Error Fix (Code 1000)

## Error Summary
You're experiencing Apple Sign-In authorization error code 1000, which indicates:
```
(NOBRIDGE) ERROR  🍎 Detailed Apple error: {"code": "ERR_REQUEST_UNKNOWN", "domain": undefined, "message": "The authorization attempt failed for an unknown reason"}
[AuthenticationServices] ASAuthorizationController credential request failed with error: Error Domain=com.apple.AuthenticationServices.AuthorizationError Code=1000 "(null)"
```

## Root Cause Analysis

Error code 1000 from ASAuthorizationController typically indicates one of these issues:

1. **Missing Apple Developer Console Configuration**
   - App ID not created or missing Sign in with Apple capability
   - Service ID not properly configured
   - Private key not generated or configured in Supabase

2. **Provisioning Profile Issues**
   - Development/Distribution provisioning profile doesn't include Sign in with Apple capability
   - Bundle ID mismatch between app and provisioning profile

3. **Code Signing Issues**
   - App not properly signed with correct provisioning profile
   - Capability not enabled in Xcode project settings

## Step-by-Step Fix

### Step 1: Apple Developer Console Setup

1. **Go to [Apple Developer Console](https://developer.apple.com/account/)**

2. **Create/Update App ID:**
   - Navigate to **Certificates, Identifiers & Profiles** > **Identifiers**
   - Find or create App ID with Bundle ID: `org.name.jung`
   - **CRITICAL:** Enable "Sign In with Apple" capability
   - Click "Configure" and select "Enable as a primary App ID"
   - Save changes

3. **Create Service ID:**
   - In Identifiers, click "+" and select "Services IDs"
   - Identifier: `org.name.jung.web` (must be different from App ID)
   - Description: "Jung App Web Service"
   - Enable "Sign In with Apple"
   - Click "Configure" next to Sign In with Apple
   - Add domains and return URLs:
     - Primary App ID: `org.name.jung`
     - Domains: `your-supabase-project.supabase.co`
     - Return URLs: `https://your-supabase-project.supabase.co/auth/v1/callback`

4. **Generate Private Key:**
   - Go to **Keys** section
   - Click "+" to create new key
   - Name: "Jung App Apple Sign In Key"
   - Enable "Sign In with Apple"
   - Click "Configure" and select your primary App ID (`org.name.jung`)
   - **Download the .p8 file immediately** (you can't download it again)
   - Note the Key ID and Team ID

### Step 2: Update Provisioning Profiles

1. **Go to Provisioning Profiles in Apple Developer Console**
2. **Find your development/distribution profiles for `org.name.jung`**
3. **Edit each profile:**
   - Ensure "Sign In with Apple" capability is checked
   - If not available, you need to update your App ID first (Step 1)
   - Regenerate and download the updated profiles

### Step 3: Update Supabase Configuration

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication > Providers > Apple**
3. **Configure with these settings:**
   ```
   Service ID: org.name.jung.web
   Team ID: [Your Apple Team ID - found in Apple Developer Console]
   Key ID: [Your Key ID from the generated .p8 file]
   Private Key: [Contents of the .p8 file - paste the entire contents including headers]
   ```

### Step 4: Update EAS Configuration

Add Apple Sign-In specific configuration to your `eas.json`:

```json
{
  "cli": {
    "version": ">= 7.3.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development"
      },
      "ios": {
        "buildConfiguration": "Debug",
        "capabilities": {
          "SignInWithApple": true
        }
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "capabilities": {
          "SignInWithApple": true
        }
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production"
      },
      "ios": {
        "buildConfiguration": "Release",
        "capabilities": {
          "SignInWithApple": true
        }
      }
    },
    "ios-simulator": {
      "extends": "development",
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      },
      "env": {
        "NODE_ENV": "development",
        "EXPO_PUBLIC_ENVIRONMENT": "simulator"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Step 5: Clean Build and Test

Run these commands to ensure a clean rebuild:

```bash
# Clean all cached files
npx expo install --fix
rm -rf node_modules
npm install

# Clean iOS build
rm -rf ios/build
cd ios && xcodebuild clean && cd ..

# Prebuild with clean slate
npx expo prebuild --clean

# Build for device testing
npx expo run:ios --device

# OR use EAS build
eas build --platform ios --profile development
```

### Step 6: Verify Configuration

Add this debug function to your app to verify the configuration:

```typescript
const debugAppleSignIn = async () => {
  console.log('=== Apple Sign-In Debug Info ===');
  console.log('Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier);
  console.log('App Name:', Constants.expoConfig?.name);
  console.log('App Version:', Constants.expoConfig?.version);
  
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('Apple Sign-In Available:', isAvailable);
    
    if (!isAvailable) {
      console.log('❌ Apple Sign-In not available. Possible reasons:');
      console.log('  - Running on iOS Simulator (not supported)');
      console.log('  - Device not signed into iCloud');
      console.log('  - Two-factor authentication not enabled');
      console.log('  - iOS version < 13.0');
    } else {
      console.log('✅ Apple Sign-In is available');
    }
  } catch (error) {
    console.error('Error checking Apple Sign-In availability:', error);
  }
  
  console.log('================================');
};

// Call this in your component
useEffect(() => {
  debugAppleSignIn();
}, []);
```

## Testing Requirements

### Device Requirements
- **Real iOS device** (Apple Sign-In doesn't work in simulator)
- **iOS 13.0 or later**
- **Device signed into iCloud**
- **Two-factor authentication enabled** on the Apple ID

### Apple Developer Account Requirements
- **Active Apple Developer Program membership** ($99/year)
- **Team Admin or App Manager role**

## Common Error Codes and Solutions

### Error Code 1000
- **Cause:** Generic authorization failure
- **Fix:** Follow all steps above, especially Apple Developer Console configuration

### Error Code 1001
- **Cause:** User cancelled the request
- **Fix:** This is normal user behavior, no action needed

### Error Code 1004
- **Cause:** Request failed
- **Fix:** Check network connection and Apple services status

### Error Code -7026
- **Cause:** Bundle ID not found in Apple Developer Console
- **Fix:** Create App ID with correct bundle identifier

## Verification Checklist

Before testing, ensure:

- [ ] App ID `org.name.jung` exists in Apple Developer Console
- [ ] Sign in with Apple capability is enabled for App ID
- [ ] Service ID `org.name.jung.web` is created and configured
- [ ] Private key (.p8) is generated and configured in Supabase
- [ ] Provisioning profiles include Sign in with Apple capability
- [ ] App is built with updated provisioning profiles
- [ ] Testing on real iOS device (not simulator)
- [ ] Device is signed into iCloud with 2FA enabled

## Quick Test Commands

```bash
# Check if Apple Sign-In is properly configured
npx expo run:ios --device

# View detailed logs
npx react-native log-ios

# Check provisioning profile
security find-identity -v -p codesigning
```

If you continue to experience issues after following these steps, the problem may be related to Apple's services or your specific Apple Developer account setup. In that case, consider contacting Apple Developer Support.
