# Apple Sign-In Physical Device Authentication Fix

## 🚨 Critical Issue
Apple Sign-In fails on physical devices with the error:
```
[AuthApiError: Unacceptable audience in id_token: [org.name.jung]]
```

## 🔍 Root Cause Analysis
1. **Service ID Mismatch**: Your Supabase Apple provider is configured with a Service ID that doesn't match your app's Bundle ID
2. **Physical Device Behavior**: On physical devices, Apple ID tokens use the app's Bundle ID (`org.name.jung`) as the audience
3. **Supabase Expectation**: Supabase expects the audience to match the configured Service ID

## ✅ Solution Steps

### Step 1: Update Supabase Apple Provider Configuration

1. **Go to your Supabase Dashboard**:
   - Navigate to: [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: Jung App

2. **Access Apple Provider Settings**:
   - Go to `Authentication` → `Providers` → `Apple`

3. **Update Service ID**:
   ```
   Current Service ID: [whatever is currently set]
   Change to: org.name.jung
   ```

4. **Verify Other Settings**:
   ```
   Service ID: org.name.jung
   Team ID: [Your Apple Team ID - keep existing]
   Key ID: [Your Key ID - keep existing]
   Private Key: [Your .p8 file contents - keep existing]
   ```

### Step 2: Verify Apple Developer Console Configuration

1. **Go to Apple Developer Console**:
   - Navigate to: [Apple Developer Console](https://developer.apple.com/account/)
   - Go to `Certificates, Identifiers & Profiles` → `Identifiers`

2. **Check App ID Configuration**:
   - Find your App ID: `org.name.jung`
   - Ensure "Sign In with Apple" capability is enabled
   - Click "Configure" next to "Sign In with Apple"

3. **Primary App ID Setup**:
   - Ensure your primary App ID (`org.name.jung`) is configured as the primary App ID
   - Enable "Sign In with Apple" if not already enabled

### Step 3: Test the Fix

After updating the Supabase configuration:

1. **Clear App Data** (important):
   ```bash
   # Delete app from device
   # Reinstall from Xcode or TestFlight
   ```

2. **Test Apple Sign-In**:
   - Open the app on your physical device
   - Try Apple Sign-In
   - Check console logs for success messages

## 🔧 Enhanced Debugging

The new enhanced authentication system includes better error handling:

```typescript
// Enhanced Apple Sign-In with Service ID validation
const result = await enhancedAuth.signInWithApple(identityToken, nonce);
```

Expected success logs:
```
🍎 Enhanced Apple Sign-In starting...
🍎 Calling Supabase signInWithIdToken...
🍎 Apple Sign-In successful: { userId: "...", hasSession: true }
```

## 🐛 Common Issues and Solutions

### Issue 1: "Service ID not found"
**Solution**: Ensure the Service ID in Supabase exactly matches your Bundle ID: `org.name.jung`

### Issue 2: "Invalid private key"
**Solution**: Re-copy the entire .p8 file contents including the header/footer lines:
```
-----BEGIN PRIVATE KEY-----
[your key content]
-----END PRIVATE KEY-----
```

### Issue 3: "Team ID mismatch"
**Solution**: Verify your Team ID in Apple Developer Console matches Supabase configuration

### Issue 4: Still getting audience errors
**Solution**:
1. Double-check Bundle ID spelling in Supabase (case sensitive)
2. Clear all app data and keychain entries
3. Try with a fresh app installation

## 📱 Physical Device vs Simulator Differences

| Aspect | Simulator | Physical Device |
|--------|-----------|-----------------|
| ID Token Audience | Can be flexible | Always Bundle ID |
| Keychain Access | Limited | Full access |
| Apple Services | Mocked | Real Apple servers |
| Configuration | More forgiving | Strict validation |

## 🔄 Alternative: Use Separate Service ID

If you prefer to keep a separate Service ID instead of using the Bundle ID:

1. **Create Service ID in Apple Developer Console**:
   ```
   Identifier: org.name.jung.service
   Description: Jung App Service ID
   Enable: Sign In with Apple
   ```

2. **Update iOS App Configuration**:
   ```typescript
   const credential = await AppleAuthentication.signInAsync({
     requestedScopes: [...],
     nonce: hashedNonce,
     serviceId: 'org.name.jung.service' // Add this line
   });
   ```

3. **Update Supabase Configuration**:
   ```
   Service ID: org.name.jung.service
   ```

## ✅ Final Verification

After implementing the fix, you should see:

1. **Successful Apple Sign-In**: No more audience errors
2. **User Creation**: New users appear in Supabase Auth
3. **Session Persistence**: Users stay logged in across app restarts
4. **Console Logs**: Success messages in device logs

## 🚀 Quick Test Commands

```bash
# Build and test on device
npx expo run:ios --device

# Or with EAS
eas build --platform ios --profile development
```

## 📞 Support

If issues persist after following this guide:

1. **Check Bundle ID**: Verify it's exactly `org.name.jung` everywhere
2. **Check Supabase Service ID**: Must match Bundle ID exactly
3. **Clear Cache**: Delete app, clear keychain, reinstall
4. **Check Apple Developer Console**: Ensure Sign In with Apple is enabled

The enhanced authentication system provides detailed logging to help diagnose any remaining issues.