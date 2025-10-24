# StoreKit Configuration Setup - Required!

## ⚠️ Current Issue
RevenueCat can't fetch products because the StoreKit configuration isn't active in Xcode.

## 📍 You Are Here
✅ StoreKit file created: `ios/JungStoreKit.storekit`
✅ Product IDs configured:
   - `org.name.jung.Weekly`
   - `org.name.jung.Monthly`
   - `org.name.jung.Annual`

❌ StoreKit file NOT added to Xcode project yet

## 🔧 Fix This Now (2 minutes)

### Step 1: Open Xcode
```bash
open /Users/chai/Jung/ios/jung.xcworkspace
```
**Important**: Open the `.xcworkspace` file, NOT `.xcodeproj`

### Step 2: Add StoreKit File
1. In Xcode's **Project Navigator** (left sidebar)
2. **Right-click** on the `jung` folder (the blue project icon)
3. Select **"Add Files to jung..."**
4. Navigate to the `ios` folder
5. Select **`JungStoreKit.storekit`**
6. Make sure **"Copy items if needed"** is UNCHECKED
7. Click **"Add"**

### Step 3: Enable StoreKit Configuration
1. Click on the **scheme dropdown** (next to the Run ▶️ button, should say "jung")
2. Select **"Edit Scheme..."**
3. Select **"Run"** in the left sidebar
4. Go to the **"Options"** tab
5. Under **"StoreKit Configuration"**, select **"JungStoreKit.storekit"**
6. Click **"Close"**

### Step 4: Rebuild
```bash
cd /Users/chai/Jung
npx expo run:ios
```

## ✅ How to Verify It's Fixed
- The RevenueCat error should be gone
- You should see: "RevenueCat initialized successfully" in logs
- Products should load in the subscription screen

## 🎯 What This Does
The StoreKit Configuration file provides **test subscription products** for local development without needing real App Store Connect products. This is essential for:
- Local testing
- Development environment
- Testing purchase flows
- Debugging RevenueCat integration

## 📝 Product Details in StoreKit File
| Product ID | Type | Price | Period |
|------------|------|-------|--------|
| org.name.jung.Weekly | Auto-Renewable | $0.99 | 1 Week |
| org.name.jung.Monthly | Auto-Renewable | $4.99 | 1 Month |
| org.name.jung.Annual | Auto-Renewable | $49.99 | 1 Year |

## ❓ Troubleshooting

### "I don't see the file in Add Files dialog"
- Make sure you're looking in `/Users/chai/Jung/ios/`
- The file is named `JungStoreKit.storekit`
- Try restarting Xcode

### "I don't see StoreKit Configuration option"
- Make sure you selected "Run" in Edit Scheme
- Go to the "Options" tab (not "Info" or "Arguments")
- StoreKit Configuration should be near the top

### "Still getting RevenueCat errors"
1. Make sure you selected the StoreKit file in scheme
2. Clean build folder: Xcode → Product → Clean Build Folder
3. Rebuild: `npx expo run:ios`
4. Check that product IDs in RevenueCat dashboard match exactly:
   - `org.name.jung.Weekly`
   - `org.name.jung.Monthly`
   - `org.name.jung.Annual`

## 🚀 After This Works
Once local testing works with StoreKit:
1. Create real products in App Store Connect
2. Use the same product IDs
3. Submit products for review
4. Test with TestFlight

But for NOW, you just need StoreKit configured to fix the error!