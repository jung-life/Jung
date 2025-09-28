# Physical Device Authentication Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
1. **Physical iOS device** (not simulator)
2. **Signed into iCloud** with 2FA enabled
3. **Latest app build** with enhanced authentication

### Build and Deploy
```bash
# For development testing
npx expo run:ios --device

# For EAS Build testing
eas build --platform ios --profile development
```

## 🔍 Enhanced Authentication Features

### ✅ What's Been Implemented

1. **Enhanced Environment Variable Detection**:
   - Multi-source detection (process.env, Constants.expoConfig, etc.)
   - Physical device debugging logs
   - Graceful fallbacks when variables are missing

2. **Improved Storage Handling**:
   - SecureStore with AsyncStorage fallback
   - Enhanced error handling and logging
   - Session persistence across app restarts

3. **Better Authentication Flows**:
   - Apple Sign-In with Service ID validation
   - Google Sign-In with enhanced token handling
   - Email/password with improved error messages

4. **Physical Device Optimization**:
   - PKCE flow for better mobile security
   - Device-specific authentication paths
   - Comprehensive debugging and logging

## 🔧 Testing Scenarios

### 1. Apple Sign-In Testing

**Expected Success Flow:**
```
🍎 Enhanced Apple Sign-In starting...
🍎 Calling Supabase signInWithIdToken...
🍎 Apple Sign-In successful: { userId: "...", hasSession: true }
📱 Auth state changed: SIGNED_IN Has session
```

**Common Issues to Test:**
- **Service ID Mismatch**: Should show specific error message about Bundle ID
- **Missing Configuration**: Should provide clear troubleshooting steps
- **Network Issues**: Should handle gracefully with retry options

**Test Steps:**
1. Open app on physical device
2. Tap "Sign in with Apple"
3. Complete Apple authentication
4. Verify user is logged in
5. Close and reopen app to test session persistence

### 2. Google Sign-In Testing

**Expected Success Flow:**
```
🔵 Starting enhanced Google Sign-In...
🔵 Using enhanced Google auth for physical device...
🔵 Enhanced Google login completed successfully
📱 Auth state changed: SIGNED_IN Has session
```

**Test Steps:**
1. Tap "Sign in with Google"
2. Complete Google authentication
3. Verify user is logged in
4. Test session persistence

### 3. Email/Password Testing

**Expected Success Flow:**
```
📧 Attempting enhanced email login...
📧 Enhanced Email Sign-In starting...
📧 Email Sign-In successful: { userId: "...", hasSession: true }
```

**Test Steps:**
1. Enter valid email and password
2. Tap "Login"
3. Verify successful authentication
4. Test with invalid credentials

### 4. Environment Variables Testing

**Check Console Logs:**
```
🔧 App Config: Processing environment variables...
🔧 EXPO_PUBLIC_SUPABASE_URL: Set (https://o...)
🔧 EXPO_PUBLIC_SUPABASE_ANON_KEY: Set (eyJhbGciO...)
🔧 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: Set (478933387...)
```

**What to Look For:**
- All required environment variables should show as "Set"
- No "NOT SET" warnings for critical variables
- Supabase client creation should be successful

## 🐛 Troubleshooting Common Issues

### Issue 1: Apple Sign-In "Unacceptable audience" Error

**Error Message:**
```
[AuthApiError: Unacceptable audience in id_token: [org.name.jung]]
```

**Solution:**
1. Go to Supabase Dashboard → Authentication → Providers → Apple
2. Update Service ID to: `org.name.jung`
3. Clear app data and test again

### Issue 2: Environment Variables Not Found

**Error Message:**
```
🔍 Environment variable EXPO_PUBLIC_SUPABASE_URL: NOT FOUND
❌ Failed to create Supabase client - missing environment variables
```

**Solution:**
1. Check `.env` file exists and has correct variables
2. Rebuild app with `npx expo run:ios --device --clear`
3. Verify `app.config.js` is processing variables correctly

### Issue 3: Google Sign-In Configuration Error

**Error Message:**
```
No ID token or configuration error
```

**Solution:**
1. Verify `EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID` is set correctly
2. Check Google Cloud Console OAuth configuration
3. Ensure Bundle ID matches in all configurations

### Issue 4: Session Not Persisting

**Symptoms:**
- User gets logged out after app restart
- Session check returns null

**Solution:**
1. Check SecureStore permissions
2. Verify AsyncStorage fallback is working
3. Check auth state change listener

## 📋 Test Checklist

### Pre-Test Setup
- [ ] Physical iOS device connected
- [ ] Latest build deployed
- [ ] Environment variables verified
- [ ] Console logs accessible

### Apple Sign-In Tests
- [ ] First-time sign-in works
- [ ] Session persists after app restart
- [ ] Logout works correctly
- [ ] Error handling for cancellation
- [ ] Service ID mismatch error shows helpful message

### Google Sign-In Tests
- [ ] First-time sign-in works
- [ ] Session persists after app restart
- [ ] Logout works correctly
- [ ] Error handling for cancellation
- [ ] Configuration error shows troubleshooting

### Email/Password Tests
- [ ] Valid credentials work
- [ ] Invalid credentials show appropriate error
- [ ] Session persists after app restart
- [ ] Password reset flow (if implemented)

### General Tests
- [ ] Environment variables load correctly
- [ ] Supabase client initializes
- [ ] Auth state changes trigger UI updates
- [ ] Navigation works after authentication
- [ ] User data loads correctly

## 🔍 Debugging Tools

### Console Log Filters
Use these filters in Xcode console to focus on authentication:
- `🍎` - Apple Sign-In logs
- `🔵` - Google Sign-In logs
- `📧` - Email authentication logs
- `📱` - SupabaseContext logs
- `🔍` - Environment variable logs
- `🔐` - Storage-related logs

### Key Log Messages to Monitor
```
✅ Supabase client created successfully
✅ Initial session check: Has session
📱 Auth state changed: SIGNED_IN Has session
🔐 SecureStore: Successfully set sb-...
```

### Testing Commands
```bash
# Clear app data and reinstall
npx expo run:ios --device --clear

# Build with specific profile
eas build --platform ios --profile development

# Check environment in build
npx expo config

# View logs in real-time
npx expo logs --platform ios
```

## 🎯 Expected Results

### Successful Authentication
1. **Clear Console Logs**: No error messages in authentication flow
2. **Persistent Session**: User stays logged in after app restart
3. **Proper Navigation**: App navigates to appropriate screen after login
4. **User Data**: Profile information loads correctly

### Error Recovery
1. **Graceful Failures**: Clear error messages for common issues
2. **Retry Mechanisms**: Users can retry after fixing issues
3. **Fallback Flows**: Alternative authentication methods work

### Performance
1. **Fast Login**: Authentication completes within 2-3 seconds
2. **Quick Session Check**: App determines auth state quickly on startup
3. **Smooth UI**: No blocking or freezing during authentication

## 🔄 Continuous Testing

### Regular Test Cases
- Test all authentication methods weekly
- Verify environment variables after any config changes
- Check session persistence after app updates
- Monitor error rates and user feedback

### Automated Testing
Consider implementing:
- Unit tests for authentication functions
- Integration tests for auth flows
- Automated environment variable validation
- Performance benchmarks for authentication

## 📞 Support and Issues

### If Authentication Still Fails
1. **Check this guide**: Follow all troubleshooting steps
2. **Review console logs**: Look for specific error patterns
3. **Test environment variables**: Ensure all required variables are set
4. **Verify configurations**: Double-check Supabase and OAuth settings

### Known Limitations
- Apple Sign-In requires physical device (not simulator)
- Google Sign-In needs proper OAuth configuration
- Environment variables must be available at build time
- Some authentication features require network connectivity

The enhanced authentication system provides comprehensive logging and error handling to help diagnose and resolve issues quickly.