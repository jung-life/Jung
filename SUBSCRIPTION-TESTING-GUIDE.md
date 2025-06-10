# 🧪 How to Test Your Subscription System

Your in-app purchase system is now fully integrated! Here's how to see it in action:

## 🎯 **Where to Find Subscription Features:**

### **1. Hamburger Menu (Top-Right)**
- Tap the hamburger menu (☰) on any screen
- Look for **"Upgrade to Premium"** option with crown icon
- If you're already premium, it shows **"Premium Active"**

### **2. Home Screen (PostLoginScreen)**
- Purple upgrade card shows when you're not premium
- **"Upgrade Now"** button navigates to subscription screen
- If premium, shows golden "Premium Active" status

### **3. Conversations Screen**
- When selecting avatars, premium avatars show:
  - Crown icons (👑)
  - "Premium" text
  - Clicking prompts upgrade

## 🚀 **How to Test:**

### **Step 1: See Non-Premium State**
1. Open your app
2. You should see:
   - Purple upgrade card on home screen
   - "Upgrade to Premium" in hamburger menu
   - Premium avatars locked with crown icons

### **Step 2: Navigate to Subscription Screen**
1. Tap **"Upgrade Now"** button OR
2. Tap hamburger menu → **"Upgrade to Premium"**
3. You should see the beautiful subscription screen with:
   - Weekly: $2.99/week
   - Monthly: $9.99/month (Most Popular)
   - Yearly: $79.99/year (33% savings)

### **Step 3: Test Avatar Selection**
1. Go to Conversations
2. Try to select premium avatars:
   - **The Flourishing Guide** (Premium)
   - **Sage** (Premium) 
   - **Awakener** (Premium)
3. Should show upgrade prompt

### **Step 4: Test Purchase Flow** (Sandbox)
1. On subscription screen, tap any plan
2. Should trigger purchase flow
3. Use sandbox account for testing

## 🎨 **Visual Features You Should See:**

### **Subscription Screen:**
- ✨ Gradient backgrounds
- 👑 Crown icons
- 💫 "Most Popular" badge on monthly
- 💰 "Save 33%" badge on yearly
- 🔄 "Restore Purchases" button

### **Premium Indicators:**
- 👑 Crown icons on premium avatars
- ⭐ Star icons in status displays
- 🌟 Golden colors for active premium
- 🟣 Purple colors for upgrade prompts

### **Navigation Integration:**
- 📱 Accessible from hamburger menu
- 🏠 Prominently featured on home screen
- 🤖 Integrated into avatar selection

## 🔧 **Development Testing:**

### **Enable Test Mode:**
In `src/lib/inAppPurchaseService.ts`, the system uses test product IDs:
- `jungprosub` (test subscription)
- `Jung_Pro_Test` (test product)

### **Mock Premium Status:**
To test premium features without purchasing:
```typescript
// Temporarily in useSubscription.ts, return true:
const isPremiumUser = true; // Force premium for testing
```

### **Check Console Logs:**
Look for these logs:
- "IAP Connection result"
- "Available products"
- "Purchase updated"
- "Subscription status"

## 🚨 **Troubleshooting:**

### **Products Not Loading:**
- Check internet connection
- Verify product IDs exist
- Check App Store Connect setup

### **Purchase Flow Not Working:**
- Ensure you're signed into sandbox account
- Check device is properly configured
- Verify app bundle ID matches

### **UI Not Showing:**
- Ensure app is rebuilt after changes
- Check for any TypeScript errors
- Verify navigation is properly set up

## 📋 **Test Checklist:**

- [ ] Can see "Upgrade to Premium" in hamburger menu
- [ ] Purple upgrade card shows on home screen
- [ ] Subscription screen loads with 3 pricing tiers
- [ ] Premium avatars show crown icons
- [ ] Clicking premium avatars shows upgrade prompt
- [ ] Purchase flow initiates when tapping subscription plans
- [ ] "Restore Purchases" button works
- [ ] Premium status updates correctly after purchase

## 🎉 **Success Indicators:**

When working correctly, you should see:
1. **Seamless UI integration** - subscription options everywhere
2. **Visual feedback** - clear premium/non-premium states
3. **Easy access** - multiple paths to subscription screen
4. **Professional design** - polished, app-store ready appearance

The system is now ready for production testing and eventual App Store submission! 🚀

## 📱 **Next Steps:**
1. Test the UI flow thoroughly
2. Set up sandbox accounts for purchase testing
3. Configure actual product IDs in App Store Connect
4. Test full purchase flow with real transactions
