# Fix Provisioning Profile Capabilities Error

## Current Issue
Your iOS build failed with these errors:
```
- Provisioning profile "*[expo] org.name.jung AppStore 2025-05-23T15:56:31.081Z" doesn't support the Associated Domains and Push Notifications capability.
- Provisioning profile "*[expo] org.name.jung AppStore 2025-05-23T15:56:31.081Z" doesn't include the aps-environment and com.apple.developer.associated-domains entitlements.
```

## Root Cause
Your app's provisioning profile is missing required capabilities:
- **Associated Domains** (for OAuth redirects)
- **Push Notifications** (configured in your app.json)
- **Apple Sign In** (needs to be manually enabled)

## Solution: Update Apple Developer Console

### Step 1: Go to Apple Developer Console
- Open: https://developer.apple.com/account/resources/identifiers/bundleId/edit/8GPCP8LWN2
- Or go to: https://developer.apple.com/account/ → Identifiers → Find `org.name.jung`

### Step 2: Enable Required Capabilities
Check and enable these capabilities for your App ID:

#### ✅ **Sign In with Apple**
- Find "Sign In with Apple" in capabilities list
- Check the box to enable it
- This is required for Apple Sign In functionality

#### ✅ **Associated Domains**  
- Find "Associated Domains" in capabilities list
- Check the box to enable it
- This is required for OAuth redirects (auth.expo.io)

#### ✅ **Push Notifications**
- Find "Push Notifications" in capabilities list  
- Check the box to enable it
- This matches your app.json configuration

### Step 3: Save Changes
- Click **"Save"** after enabling all capabilities
- Apple will regenerate your provisioning profiles

### Step 4: Rebuild with Updated Capabilities
```bash
# Wait a few minutes for Apple to update profiles, then rebuild
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

## Alternative: Remove Unused Capabilities

If you don't need some capabilities, remove them from app.json:

### Remove Associated Domains (if not needed)
```json
{
  "ios": {
    "associatedDomains": [
      // Remove this array if not using deep links
    ]
  }
}
```

### Configure Only Required Capabilities
For Apple Sign In, you only need:
- **Sign In with Apple** capability
- **Associated Domains** (if using OAuth redirects)

## Quick Fix Commands

### Option 1: Enable All Capabilities in Apple Console
1. Go to Apple Developer Console
2. Enable: Sign In with Apple, Associated Domains, Push Notifications
3. Save changes
4. Rebuild:
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

### Option 2: Simplify app.json (Remove Unused Features)
Remove unused capabilities from app.json and rebuild:
```bash
# Update app.json to remove unused features
# Then rebuild
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

## Understanding the Error

### What Happened:
1. EAS created a provisioning profile based on old App ID capabilities
2. Your App ID didn't have all required capabilities enabled
3. Build failed because profile doesn't match app requirements

### Why EXPO_NO_CAPABILITY_SYNC=1 Helps:
- Prevents EAS from automatically managing capabilities
- Requires manual setup in Apple Developer Console
- Gives you full control over which capabilities are enabled

## Required Capabilities for Apple Sign In

### Minimum Required:
- ✅ **Sign In with Apple** - For Apple authentication
- ✅ **Associated Domains** - For OAuth redirects

### Optional (Based on Your App):
- ⚠️ **Push Notifications** - Only if you send push notifications
- ⚠️ **Background App Refresh** - Only if needed
- ⚠️ **In-App Purchase** - Only if you have purchases

## Step-by-Step Fix

### 1. Clean Up app.json (Remove Unused)
```json
{
  "ios": {
    "bundleIdentifier": "org.name.jung",
    // Remove associatedDomains if not using deep links
    // Keep only what you actually need
  }
}
```

### 2. Apple Developer Console
- Enable only required capabilities
- Save changes and wait 5-10 minutes

### 3. Rebuild
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios
```

## Success Indicators

### ✅ Build Will Succeed When:
- App ID has all required capabilities enabled
- Provisioning profile includes all entitlements
- app.json matches Apple Developer Console setup

### 🔧 Most Common Fix:
1. **Go to Apple Developer Console**
2. **Enable "Sign In with Apple" capability**
3. **Enable "Associated Domains" capability**  
4. **Save and wait 5-10 minutes**
5. **Rebuild with same command**

This error is very common and easily fixed by updating capabilities in Apple Developer Console!
