# Google Sign-In Setup Guide for Jung App

## 🔍 Issue Analysis

Based on code analysis, the Google Sign-In implementation is missing several critical components:

### Current Issues Found:
1. **Missing Google OAuth Plugin** in app.json
2. **No Google Services Configuration Files** (GoogleService-Info.plist for iOS, google-services.json for Android)
3. **Missing Environment Variables** for Google Client IDs
4. **Incomplete EAS Configuration** for Google OAuth
5. **Missing URL Scheme Configuration** for Google OAuth

---

## 📋 Complete Setup Checklist

### 1. Google Cloud Console Setup

#### A. Create/Configure Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project: `jung-app`
3. Enable the following APIs:
   - **Google+ API** (for user info)
   - **People API** (for profile data)

#### B. Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required information:
   ```
   App name: Jung - AI Psychology Guide
   User support email: your-email@domain.com
   Developer contact information: your-email@domain.com
   ```
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (for development)

#### C. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**

**For iOS:**
```
Application type: iOS
Name: Jung iOS App
Bundle ID: org.name.jung
```

**For Android:**
```
Application type: Android
Name: Jung Android App
Package name: com.yourcompany.jungai
SHA-1 certificate fingerprint: [Get from EAS or Android Studio]
```

**For Web (Development):**
```
Application type: Web application
Name: Jung Web Development
Authorized redirect URIs:
- https://auth.expo.io/@infinitydata.ai/jung
- http://localhost:8081
```

### 2. Get SHA-1 Fingerprint for Android

Run this command to get your SHA-1 fingerprint:
```bash
# For development build
eas credentials -p android

# Or manually get fingerprint
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### 3. Download Configuration Files

#### For iOS:
1. Download `GoogleService-Info.plist` from Google Cloud Console
2. Place it in the root directory of your project

#### For Android:
1. Download `google-services.json` from Google Cloud Console
2. Place it in the root directory of your project

---

## 🛠️ Code Implementation

### 1. Update app.json

Add Google authentication plugin and configuration:

```json
{
  "expo": {
    "name": "jung",
    "plugins": [
      "expo-secure-store",
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin"
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "org.name.jung",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "google",
            "CFBundleURLSchemes": ["YOUR_IOS_CLIENT_ID"]
          }
        ]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.yourcompany.jungai"
    }
  }
}
```

### 2. Install Required Dependencies

```bash
npm install @react-native-google-signin/google-signin
npx expo install expo-auth-session expo-crypto expo-web-browser
```

### 3. Update Environment Variables

Create `.env` file in root directory:
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id.apps.googleusercontent.com
```

### 4. Update EAS Configuration

Update `eas.json`:
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS": "your-ios-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID": "your-android-client-id",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB": "your-web-client-id"
      }
    }
  }
}
```

---

## 🔧 Supabase Configuration

### 1. Supabase Dashboard Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:

```
Client ID: your-web-client-id.apps.googleusercontent.com
Client Secret: your-client-secret-from-google-console
```

### 2. Configure Redirect URLs

In Supabase Auth settings, add these redirect URLs:
```
Site URL: https://your-app-domain.com
Redirect URLs:
- https://auth.expo.io/@infinitydata.ai/jung
- exp://localhost:8081
- jung://
- com.yourcompany.jungai://
- org.name.jung://
```

---

## 🔍 Testing Checklist

### Before Testing:
- [ ] Google Cloud project created and configured
- [ ] OAuth consent screen configured
- [ ] iOS and Android OAuth clients created
- [ ] GoogleService-Info.plist downloaded and placed in root
- [ ] google-services.json downloaded and placed in root
- [ ] Environment variables set
- [ ] Supabase Google provider enabled
- [ ] App rebuilt with new configuration

### Test Steps:
1. **Development Build:**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Install and Test:**
   - Install the development build on device
   - Tap "Sign in with Google"
   - Verify browser opens with Google OAuth
   - Check for successful authentication
   - Verify user data in Supabase dashboard

### Common Issues and Solutions:

#### Issue: "Developer Error" in Google OAuth
**Solution:** Check that:
- Bundle ID matches exactly in Google Console
- SHA-1 fingerprint is correct for Android
- OAuth consent screen is configured

#### Issue: "Invalid redirect URI"
**Solution:** Ensure redirect URLs in Supabase match:
- `https://auth.expo.io/@infinitydata.ai/jung`
- Your app's custom scheme

#### Issue: "Configuration error"
**Solution:** Verify:
- GoogleService-Info.plist is in root directory
- google-services.json is in root directory
- Client IDs in environment variables match Google Console

---

## 🚀 Deployment Checklist

### Production Setup:
1. **Create Production OAuth Clients** in Google Console
2. **Update Production Environment Variables** in EAS
3. **Configure Production Redirect URLs** in Supabase
4. **Submit OAuth Consent Screen for Review** (if needed for public app)

### Final Verification:
- [ ] Production build created with correct credentials
- [ ] Google Sign-In works on TestFlight/Play Console internal testing
- [ ] User data correctly stored in Supabase
- [ ] No console errors during authentication flow

---

## 📞 Support

If issues persist after following this guide:

1. **Check Logs:**
   ```bash
   npx expo logs --type=device
   ```

2. **Verify Network Requests:**
   - Check browser network tab during OAuth flow
   - Verify Supabase auth logs

3. **Test with Different Google Account:**
   - Some accounts may have restrictions
   - Try with a fresh Google account

---

## 📝 Quick Reference

### Important URLs:
- Google Cloud Console: https://console.cloud.google.com/
- Supabase Dashboard: https://supabase.com/dashboard
- EAS Build Logs: https://expo.dev/

### Key Files:
- `GoogleService-Info.plist` (iOS config)
- `google-services.json` (Android config)
- `.env` (Environment variables)
- `eas.json` (Build configuration)

### Bundle Identifiers:
- iOS: `org.name.jung`
- Android: `com.yourcompany.jungai`
