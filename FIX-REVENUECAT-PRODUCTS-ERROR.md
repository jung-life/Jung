# RevenueCat "Error fetching offerings" Fix

## Current Error
```
[RevenueCat] 🍎‼️ Error fetching offerings - The operation couldn't be completed. (RevenueCat.OfferingsManager.Error error 1.)
There's a problem with your configuration. None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect (or the StoreKit Configuration file if one is being used).
```

## ✅ FIXED Issues
- ✅ Added missing environment variables
- ✅ Enhanced error handling in RevenueCat service
- ✅ Created comprehensive diagnostic script
- ✅ Updated service with detailed error messages

## 🔧 What Was Fixed

### 1. Missing Environment Variables
Added to `.env`:
```bash
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_YourGoogleKeyHere
```

### 2. Enhanced Error Handling
Updated `src/lib/revenueCatService.ts` with:
- Specific error detection for OfferingsManager.Error error 1
- Detailed logging for configuration issues
- Graceful fallback when offerings are empty
- Clear instructions pointing to https://rev.cat/why-are-offerings-empty

### 3. Diagnostic Script
Created `debug-revenuecat-configuration.js` to:
- Check environment variables
- Validate app configuration
- Provide step-by-step fixes
- List common issues and solutions

## 🚀 Next Steps to Complete Fix

### Step 1: Run Diagnostic Script
```bash
node debug-revenuecat-configuration.js
```

### Step 2: Fix Missing Configuration
The error indicates one of these issues:

#### A) No Products in RevenueCat Dashboard
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Navigate to your project → "Products" tab
3. Click "Add Product"
4. Enter exact Product ID from App Store Connect
5. Configure entitlement "premium" for the product

#### B) Missing Products in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → "Features" → "In-App Purchases"
3. Create Auto-Renewable Subscription or In-App Purchase
4. Set Product ID (e.g., "jung_premium_monthly")
5. Configure pricing and submit for review

#### C) Bundle ID Mismatch
Ensure Bundle ID matches exactly in:
- RevenueCat Dashboard Project Settings
- App Store Connect App Information
- `app.json` expo.ios.bundleIdentifier
- iOS Xcode project settings

### Step 3: For iOS Development Testing
Add StoreKit Configuration file:
1. Open Xcode project
2. File → New → File → StoreKit Configuration
3. Add your subscription products
4. Set as active scheme for testing

### Step 4: Test the Fix
```bash
# Clear cache and restart
npx expo start --clear

# Check console logs for detailed RevenueCat errors
# Look for "RevenueCat Configuration Error" messages
```

## 🔍 Debugging Commands

```bash
# Validate configuration
node debug-revenuecat-configuration.js

# Clear RevenueCat cache
rm -rf node_modules/.cache
npx expo start --clear

# Check environment variables
cat .env | grep REVENUECAT
```

## 📚 Resources

- [Why are offerings empty?](https://rev.cat/why-are-offerings-empty)
- [RevenueCat iOS Setup](https://docs.revenuecat.com/docs/ios)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [App Store Connect](https://appstoreconnect.apple.com)

## 🎯 Priority: MEDIUM
This affects subscription functionality but doesn't block core app features. The enhanced error handling now provides clear guidance for fixing the configuration issues.

## ✅ Verification
After fixing the configuration:
1. Restart development server
2. Check console for "RevenueCat initialized successfully"
3. Verify offerings load without errors
4. Test subscription flow in development
