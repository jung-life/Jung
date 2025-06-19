# Credit System UI Locations

This document shows exactly where users can see their credit limits and credit-related information throughout the app.

## 🎯 Where Users Can See Credit Information

### 1. **Chat Screen Header** ⭐ PRIMARY LOCATION
**File**: `src/screens/ChatScreen.tsx`
**Location**: Top right of the chat screen header
**Component**: `<CreditDisplay variant="header" showUpgradeButton={true} />`

**What Users See**:
- 💰 Coin icon with current credit balance (e.g., "25")
- Color-coded status:
  - 🟢 Purple: Good credits (5+)
  - 🟡 Amber: Low credits (1-4)
  - 🔴 Red: No credits (0)
- ➕ Plus icon when credits are low
- Tappable to go to subscription screen

**Example Display**:
```
[💰 25] [🧠 Insights]
```

### 2. **Credit Checks Before Messaging**
**File**: `src/screens/ChatScreen.tsx`
**Function**: `handleSendMessage()`

**What Users See**:
- Alert dialog when trying to send a message without credits:
  ```
  "No Credits Available"
  "You need credits to send messages. Would you like to 
   purchase more credits or upgrade your plan?"
  
  [Cancel] [Buy Credits]
  ```

### 3. **Subscription/Upgrade Screen** ✅ IMPLEMENTED
**File**: `src/screens/SubscriptionScreen.tsx`
**Component**: `<CreditDisplay variant="detailed" showUpgradeButton={false} />`

**What Users See**:
- Large credit balance display at top of subscription screen
- Current subscription tier
- Monthly credit allowance
- Low credit warnings
- Clear credit status before showing subscription options
- Updated title: "Credit-Based Subscriptions"
- Updated subtitle: "Choose a monthly plan to get credits automatically, or buy credit packages as needed"

## 🎨 Credit Display Component Variants

### Header Variant (Compact)
```typescript
<CreditDisplay variant="header" showUpgradeButton={true} />
```
- Small coin icon + number
- Perfect for headers/navigation
- Shows upgrade hint when low

### Compact Variant (Medium)
```typescript
<CreditDisplay variant="compact" showUpgradeButton={true} />
```
- Credit count + tier name
- Good for cards/lists
- Includes upgrade button

### Detailed Variant (Large)
```typescript
<CreditDisplay variant="detailed" showUpgradeButton={true} />
```
- Full credit information
- Tier details
- Monthly allowance
- Warning messages
- Perfect for dedicated screens

## 💡 Recommended UI Additions

### 1. **Home/Dashboard Screen**
Add to your main dashboard:
```typescript
<CreditDisplay variant="compact" showUpgradeButton={true} />
```

### 2. **Profile/Account Screen**
Add detailed view:
```typescript
<CreditDisplay variant="detailed" showUpgradeButton={true} />
```

### 3. **Navigation Menu/Sidebar**
Add compact view:
```typescript
<CreditDisplay variant="compact" showUpgradeButton={false} />
```

## 🔔 Credit Notifications

### Low Credit Alert (Built-in)
When credits < 5, the display automatically shows:
- ⚠️ Amber warning colors
- "Low credits" message
- Upgrade suggestions

### No Credit Alert (Built-in)
When credits = 0, the display shows:
- 🚨 Red warning colors
- "Out of credits!" message
- Purchase prompts

## 📱 User Experience Flow

### Typical User Journey:
1. **User opens chat** → Sees credit balance in header
2. **User types message** → Credit check happens automatically
3. **No credits?** → Alert with upgrade options
4. **Has credits?** → Message sends, 1 credit deducted
5. **Credits updated** → Header refreshes in real-time

### Visual Feedback:
- ✅ **Good credits**: Purple coin icon, no warnings
- ⚠️ **Low credits**: Amber coin icon, plus button visible
- 🚨 **No credits**: Red coin icon, blocked from sending

## 🎯 Implementation Status

### ✅ Already Implemented:
- [x] Chat screen header display
- [x] Credit checking before messages
- [x] Real-time credit updates
- [x] Automatic credit deduction
- [x] Low credit warnings
- [x] No credit blocking

### 🔧 Suggested Additions:
- [ ] Add to main dashboard
- [ ] Add to profile screen
- [ ] Add to navigation menu
- [ ] Push notifications for low credits
- [ ] Credit purchase confirmation
- [ ] Usage history display

## 🎨 Example Implementations

### Dashboard Integration
```typescript
// In your main dashboard screen
<View style={tw`bg-white rounded-xl p-4 mb-4`}>
  <Text style={tw`text-lg font-bold mb-2`}>Your Credits</Text>
  <CreditDisplay variant="detailed" showUpgradeButton={true} />
</View>
```

### Menu Integration
```typescript
// In hamburger menu or sidebar
<TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
  <CreditDisplay variant="compact" showUpgradeButton={false} />
</TouchableOpacity>
```

### Profile Screen Integration
```typescript
// In profile/account screen
<View style={tw`mb-6`}>
  <Text style={tw`text-xl font-bold mb-4`}>Account Credits</Text>
  <CreditDisplay variant="detailed" showUpgradeButton={true} />
</View>
```

## 🎯 Summary

Users can currently see their credit limits in:
1. **Chat screen header** (primary location)
2. **Before sending messages** (automatic checks)
3. **Subscription screen** (when implemented)

The credit system provides clear visual feedback and prevents users from exceeding their limits while encouraging upgrades when needed.
