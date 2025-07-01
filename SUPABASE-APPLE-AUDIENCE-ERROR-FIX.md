# Supabase Apple Sign-In Audience Error Fix

## Error Summary
You're now successfully authenticating with Apple, but Supabase is rejecting the token:
```
[AuthApiError: Unacceptable audience in id_token: [org.name.jung]]
```

## Root Cause
The "audience" in the Apple ID token is your app's Bundle ID (`org.name.jung`), but Supabase expects the Service ID. This is a configuration mismatch in your Supabase Apple provider settings.

## Quick Fix

### Option 1: Update Supabase Service ID (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication > Providers > Apple**
3. **Update the Service ID to match your Bundle ID:**
   ```
   Current Service ID: org.name.jung.web (or something else)
   Change to: org.name.jung
   ```

### Option 2: Create Matching Service ID in Apple Developer Console

If you prefer to keep a separate Service ID:

1. **Go to Apple Developer Console**
2. **Navigate to Certificates, Identifiers & Profiles > Identifiers**
3. **Create new Service ID:**
   - Identifier: `org.name.jung` (same as Bundle ID)
   - Description: "Jung App Service ID"
   - Enable "Sign In with Apple"
   - Configure with your domain settings

## Detailed Steps for Option 1 (Recommended)

### Step 1: Update Supabase Configuration
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers** > **Apple**
3. Update these settings:
   ```
   Service ID: org.name.jung
   Team ID: [Your Apple Team ID]
   Key ID: [Your Key ID from .p8 file]
   Private Key: [Contents of your .p8 file]
   ```

### Step 2: Verify Apple Developer Console Settings
1. In Apple Developer Console, go to **Certificates, Identifiers & Profiles** > **Identifiers**
2. Find your App ID: `org.name.jung`
3. Ensure "Sign In with Apple" is enabled
4. If you have a separate Service ID, you can either:
   - Delete it (if not used elsewhere)
   - Or update Supabase to use the separate Service ID

### Step 3: Test the Fix
After updating the Supabase configuration, test Apple Sign-In again. The authentication should now complete successfully.

## Why This Happens

When you use Apple Sign-In in a native iOS app:
- The `audience` (aud) claim in the ID token is set to your app's Bundle ID
- Supabase expects this to match the Service ID you configured
- If they don't match, Supabase rejects the token

## Alternative: Service ID Approach

If you want to use a separate Service ID (like `org.name.jung.web`):

1. **Update your iOS app to specify the Service ID:**
   ```typescript
   const credential = await AppleAuthentication.signInAsync({
     requestedScopes: [
       AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
       AppleAuthentication.AppleAuthenticationScope.EMAIL,
     ],
     nonce: hashedNonce,
     // Add this line:
     serviceId: 'org.name.jung.web'
   });
   ```

2. **Ensure the Service ID exists in Apple Developer Console with proper configuration**

## Quick Test Commands

After making the Supabase configuration change:

```bash
# Test on device
npx expo run:ios --device

# Or if using EAS
eas build --platform ios --profile development
```

## Expected Success Flow

After the fix, you should see:
```
🍎 Apple credential received: {...}
🍎 Authenticating with Supabase...
🍎 Supabase authentication successful: { userId: "...", hasSession: true }
🍎 Apple login completed successfully
```

## Troubleshooting

If you still get errors after the fix:

1. **Double-check the Service ID spelling** in Supabase matches exactly
2. **Verify your Apple private key** is correctly pasted (including headers)
3. **Ensure your Team ID and Key ID** are correct
4. **Try clearing the app data** and testing again

The most common cause of this error is simply a typo in the Service ID field in Supabase.
