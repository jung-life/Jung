# Fix "Looking for Development Servers" Issue

## What's Happening
Your app shows "Looking for development servers" because you built with the **development** profile, which creates a development client that expects to connect to a development server.

## Quick Fix Options

### Option 1: Start Development Server (Recommended)

Your development build needs a development server running. Start it with:

```bash
# Start the development server
npm start
# or
npx expo start

# Make sure both your computer and iPhone are on the same WiFi network
```

**Then on your iPhone:**
1. Open the jung app
2. It should automatically connect to the development server
3. Navigate to login screen and test Apple Sign In

### Option 2: Build Standalone Version

If you want a standalone app that doesn't need a development server:

```bash
# Build a preview version (standalone, no server needed)
eas build --profile preview --platform ios
```

**Differences:**
- **Development profile:** Needs development server running
- **Preview profile:** Standalone app, no server needed

## Understanding EAS Build Profiles

### Development Profile (What you built)
- **Purpose:** Live development with hot reload
- **Needs:** Development server running on your computer
- **Benefits:** Real-time code updates, debugging
- **Requires:** Same WiFi network, `expo start` running

### Preview Profile (Alternative)
- **Purpose:** Standalone testing
- **Needs:** Nothing, works independently
- **Benefits:** No server dependency, works anywhere
- **Install:** Same QR code process

## Quick Solution: Start Development Server

### 1. Start Server on Your Computer
```bash
# In your project directory
npm start
```

### 2. Connect Your iPhone
- Make sure iPhone and computer are on same WiFi
- Open the jung app on your iPhone
- It should connect automatically and show your app

### 3. Test Apple Sign In
- Navigate to login screen
- Test the Apple Sign In button
- See improved error messages

## Alternative: Build Preview Version

If you prefer a standalone app:

### 1. Build Preview Version
```bash
# Build standalone version
eas build --profile preview --platform ios
```

### 2. Install New Build
- Wait for build to complete (~15-20 minutes)
- Install via QR code (same process as before)
- This version won't need a development server

## Current EAS Configuration

Your `eas.json` has these profiles:

```json
{
  "development": {
    "developmentClient": true,  // <- This requires development server
    "distribution": "internal"
  },
  "preview": {
    "distribution": "internal"  // <- This is standalone
  }
}
```

## Recommended Approach

### For Immediate Testing:
```bash
# Start development server
npm start

# Keep it running while testing
# Your iPhone app will connect automatically
```

### For Independent Testing:
```bash
# Build preview version
eas build --profile preview --platform ios

# Install new build when ready
```

## Troubleshooting Development Server Connection

### iPhone Can't Find Server:
1. **Same WiFi:** Ensure both devices on same network
2. **Firewall:** Check if firewall is blocking Expo
3. **IP Address:** Try connecting manually with IP shown in terminal

### Server Won't Start:
```bash
# Clear cache and restart
npx expo start --clear

# Or restart with tunnel
npx expo start --tunnel
```

## What You'll See

### With Development Server Running:
- ✅ App loads your login screen
- ✅ Apple Sign In button visible
- ✅ Can test Apple Sign In functionality
- ✅ Real-time updates if you change code

### With Preview Build:
- ✅ App works independently
- ✅ No server dependency
- ✅ Apple Sign In testing works
- ❌ No live updates

## Quick Commands

```bash
# Start development server (for current build)
npm start

# Build standalone version (alternative)
eas build --profile preview --platform ios

# Check build status
eas build:list
```

## Recommendation

**For immediate Apple Sign In testing:**
1. Run `npm start` on your computer
2. Open jung app on iPhone (should connect automatically)
3. Test Apple Sign In functionality

This is the fastest way to test your Apple Sign In implementation right now!
