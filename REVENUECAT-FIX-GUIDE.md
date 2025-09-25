# RevenueCat Configuration Fix Guide

## ✅ What I've Done

1. **Created StoreKit Configuration File**: `ios/JungStoreKit.storekit`
   - Added two subscription products:
     - `jung_premium_monthly` - $4.99/month
     - `jung_premium_yearly` - $49.99/year

2. **Verified Environment Variables**: Your `.env` has:
   ```
   EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_SoULVhKGqmNrgqPeMCVdrzePJeK
   EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=premium
   ```

3. **Bundle ID**: `org.name.jung`

## 🔧 Next Steps (You Need to Do These)

### Step 1: Configure StoreKit in Xcode

1. **Open your project in Xcode:**
   ```bash
   open /Users/chai/Jung/ios/jung.xcworkspace
   ```

2. **Add StoreKit Configuration to Xcode:**
   - In Xcode, in the Project Navigator (left sidebar)
   - Right-click on the `jung` folder
   - Select "Add Files to jung..."
   - Navigate to and select `JungStoreKit.storekit`
   - Click "Add"

3. **Set StoreKit Configuration as Active:**
   - Click on your scheme dropdown (near the Run button, should say "jung")
   - Select "Edit Scheme..."
   - Select "Run" on the left
   - Go to "Options" tab
   - Under "StoreKit Configuration", select "JungStoreKit.storekit"
   - Click "Close"

### Step 2: Configure Products in RevenueCat Dashboard

1. **Go to RevenueCat Dashboard:**
   - Visit: https://app.revenuecat.com
   - Log in to your account

2. **Navigate to Products:**
   - Select your project
   - Click on "Products" in the left sidebar

3. **Add Products (if not already added):**
   - Click "Add Product" or "New"
   - Add these product IDs exactly as shown:
     - Product ID: `jung_premium_monthly`
     - Product ID: `jung_premium_yearly`

4. **Configure Offering:**
   - Go to "Offerings" tab
   - Create or edit your default offering
   - Add both products to the offering
   - Make sure the entitlement is set to `premium`

5. **Verify Bundle ID:**
   - Go to "Project Settings" or "App Settings"
   - Confirm Bundle ID is: `org.name.jung`

### Step 3: Create Products in App Store Connect (For Production)

**Note**: This is only needed when you want to publish to the App Store. For local testing, the StoreKit configuration is enough.

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com

2. **Navigate to In-App Purchases:**
   - Select your app
   - Go to "Features" → "In-App Purchases"

3. **Create Subscriptions:**
   - Click the "+" button
   - Select "Auto-Renewable Subscription"
   - Create subscription group "Jung Premium"
   - Add subscriptions:
     - **Monthly**: Product ID: `jung_premium_monthly`, Price: $4.99
     - **Yearly**: Product ID: `jung_premium_yearly`, Price: $49.99

4. **Configure Details:**
   - Add subscription display name and description
   - Set pricing for your territories
   - Submit for review when ready

### Step 4: Test the Configuration

1. **Rebuild the app:**
   ```bash
   cd /Users/chai/Jung
   npx expo run:ios
   ```

2. **Check for errors:**
   - The RevenueCat error should be gone
   - You should see products loading successfully
   - Test the subscription flow

## 🐛 Troubleshooting

### If you still see errors:

1. **Clear cache and rebuild:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   npx expo start --clear
   ```

2. **Verify StoreKit is active:**
   - In Xcode, check Edit Scheme → Run → Options
   - StoreKit Configuration should be set to "JungStoreKit.storekit"

3. **Check RevenueCat Dashboard:**
   - Products must be added
   - Offering must include the products
   - Bundle ID must match: `org.name.jung`

4. **Check Product IDs match exactly:**
   - StoreKit file: `jung_premium_monthly`, `jung_premium_yearly`
   - RevenueCat Dashboard: same product IDs
   - App Store Connect (later): same product IDs

## 📝 Summary

**For Local Development (NOW):**
- ✅ StoreKit configuration file created
- ⏳ You need to: Add to Xcode and set as active scheme
- ⏳ You need to: Configure products in RevenueCat Dashboard

**For Production (LATER):**
- ⏳ You need to: Create products in App Store Connect
- ⏳ You need to: Submit products for review

## 🔗 Resources

- [RevenueCat Dashboard](https://app.revenuecat.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [RevenueCat iOS Setup Guide](https://docs.revenuecat.com/docs/ios)
- [Why are offerings empty?](https://rev.cat/why-are-offerings-empty)