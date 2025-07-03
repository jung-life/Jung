# Complete Google Sign-In Implementation Guide - Jung App

## 🚨 Current Status: Google Sign-In NOT WORKING

The current implementation has several critical issues:
1. ❌ Missing proper Google Sign-In SDK integration
2. ❌ Using wrong OAuth approach (web-based instead of native)
3. ❌ Missing native Google Sign-In configuration
4. ❌ Incomplete Supabase Google provider setup

## 🎯 GOAL: Make Google Sign-In Actually Work

This guide will implement **native Google Sign-In** that works seamlessly on iOS and Android.

---

## 📋 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Install Required Dependencies

```bash
# Remove any existing conflicting packages
npm uninstall @react-native-google-signin/google-signin

# Install the correct Google Sign-In package for Expo
npx expo install expo-auth-session expo-crypto expo-web-browser

# Install Google Sign-In SDK (this is the key missing piece)
npm install @react-native-google-signin/google-signin
```

### STEP 2: Google Cloud Console Setup

#### A. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `jung-ai-app`
3. Enable APIs:
   - **Google+ API**
   - **People API** 
   - **Identity Toolkit API**

#### B. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill required fields:
   ```
   App name: Jung - AI Psychology Guide
   User support email: your-email@example.com
   App logo: (upload jung app logo)
   App domain: https://your-domain.com (or leave blank for testing)
   Developer contact: your-email@example.com
   ```
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

#### C. Create OAuth 2.0 Credentials

**For iOS:**
1. Click **Create Credentials** → **OAuth 2.0 Client IDs**
2. Select **iOS**
3. Name: `Jung iOS App`
4. Bundle ID: `org.name.jung`
5. **Save the Client ID** - you'll need this

**For Android:**
1. Click **Create Credentials** → **OAuth 2.0 Client IDs**
2. Select **Android**
3. Name: `Jung Android App`
4. Package name: `com.yourcompany.jungai`
5. Get SHA-1 certificate fingerprint:
   ```bash
   # For development
   eas credentials -p android --profile development
   # Copy the SHA-1 fingerprint
   ```
6. **Save the Client ID** - you'll need this

**For Web (Required for Expo):**
1. Click **Create Credentials** → **OAuth 2.0 Client IDs**
2. Select **Web application**
3. Name: `Jung Web App`
4. Add authorized redirect URIs:
   ```
   https://auth.expo.io/@infinitydata.ai/jung
   ```
5. **Save the Client ID and Client Secret** - you'll need both

### STEP 3: Download Configuration Files

#### For iOS:
1. In Google Cloud Console, go to your project
2. Click **Download** next to your iOS OAuth client
3. Download `GoogleService-Info.plist`
4. Place it in your project root directory

#### For Android:
1. In Google Cloud Console, go to your project
2. Click **Download** next to your Android OAuth client
3. Download `google-services.json`
4. Place it in your project root directory

### STEP 4: Update App Configuration

#### Update `app.json`:
```json
{
  "expo": {
    "name": "jung",
    "plugins": [
      "expo-secure-store",
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "org.name.jung"
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "org.name.jung",
      "googleServicesFile": "./GoogleService-Info.plist",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "google",
            "CFBundleURLSchemes": ["REVERSED_CLIENT_ID_FROM_PLIST"]
          }
        ]
      }
    },
    "android": {
      "package": "com.yourcompany.jungai",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### STEP 5: Configure Environment Variables

Create `.env` file:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

Update `eas.json`:
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "your-web-client-id",
        "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "your-android-client-id"
      }
    }
  }
}
```

### STEP 6: Update Supabase Configuration

#### In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add credentials:
   ```
   Client ID: your-web-client-id.apps.googleusercontent.com
   Client Secret: your-web-client-secret
   ```
4. Add redirect URLs:
   ```
   Site URL: https://your-domain.com
   Additional redirect URLs:
   - https://auth.expo.io/@infinitydata.ai/jung
   - exp://localhost:8081
   - jung://
   ```

### STEP 7: Fix the LoginScreen Implementation

Replace the Google login function in `src/screens/LoginScreen.tsx`:

```typescript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Add this after the imports
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
});

// Replace the handleGoogleLogin function with this:
const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    console.log('🔵 Starting native Google Sign-In...');

    // Check if Google Play Services are available (Android)
    await GoogleSignin.hasPlayServices();

    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    console.log('🔵 Google user info:', userInfo);

    // Get the Google ID token
    const tokens = await GoogleSignin.getTokens();
    console.log('🔵 Google tokens received');

    if (tokens.idToken) {
      console.log('🔵 Signing in to Supabase with Google token...');
      
      // Sign in to Supabase using the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
      });

      if (error) {
        console.error('🔴 Supabase Google auth error:', error);
        Alert.alert('Login Error', error.message);
        return;
      }

      console.log('🟢 Google Sign-In successful!');
      
      // Store session data
      if (data.session) {
        await storeAuthData(data.session);
        console.log('🟢 Google login completed successfully');
      }
    } else {
      throw new Error('No ID token received from Google');
    }
  } catch (error: any) {
    console.error('🔴 Google Sign-In error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('🟡 User cancelled Google Sign-In');
      return;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert('Sign In In Progress', 'Google Sign-In is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Google Play Services', 'Google Play Services not available or outdated');
    } else {
      Alert.alert('Google Sign-In Error', error.message || 'An error occurred during Google Sign-In');
    }
  } finally {
    setLoading(false);
  }
};
```

### STEP 8: Test the Implementation

#### Build and Test:
```bash
# Clear cache
npx expo start --clear

# Build for iOS
eas build --platform ios --profile development

# Install on device and test
```

#### Test Checklist:
1. ✅ Tap "Sign in with Google"
2. ✅ Google Sign-In popup appears
3. ✅ Select Google account
4. ✅ Authentication succeeds
5. ✅ User is logged into the app
6. ✅ User data appears in Supabase dashboard

---

## 🔧 TROUBLESHOOTING

### Common Issues:

#### Issue: "Google Sign-In SDK not initialized"
**Solution:** Make sure `GoogleSignin.configure()` is called before any sign-in attempts.

#### Issue: "Play Services not available"
**Solution:** Test on a real Android device with Google Play Services installed.

#### Issue: "Invalid client ID"
**Solution:** 
- Check that bundle ID matches exactly: `org.name.jung`
- Verify SHA-1 fingerprint is correct for Android
- Ensure environment variables are set correctly

#### Issue: "Redirect URI mismatch"
**Solution:** Add all these URLs to Supabase auth settings:
```
https://auth.expo.io/@infinitydata.ai/jung
exp://localhost:8081
jung://
```

#### Issue: "Token verification failed"
**Solution:** Check that the web client ID in Supabase matches the one from Google Console.

---

## 🎯 VERIFICATION STEPS

After implementation, verify:

1. **Google Cloud Console:**
   - ✅ OAuth consent screen configured
   - ✅ iOS, Android, and Web OAuth clients created
   - ✅ Bundle IDs and package names match exactly

2. **App Configuration:**
   - ✅ GoogleService-Info.plist in root directory
   - ✅ google-services.json in root directory
   - ✅ app.json has Google plugin configured
   - ✅ Environment variables set

3. **Supabase:**
   - ✅ Google provider enabled
   - ✅ Web client ID and secret configured
   - ✅ Redirect URLs added

4. **Code:**
   - ✅ Native Google Sign-In SDK integrated
   - ✅ GoogleSignin.configure() called
   - ✅ handleGoogleLogin uses native SDK

---

## 🚀 DEPLOYMENT

For production:
1. Create production OAuth clients in Google Console
2. Update production environment variables in EAS
3. Update Supabase with production client credentials
4. Submit OAuth consent screen for review (if public app)

This implementation will provide **native Google Sign-In** that works reliably on both iOS and Android devices.
