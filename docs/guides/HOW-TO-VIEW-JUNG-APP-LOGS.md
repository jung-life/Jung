# How to View Jung App Logs on Your iPhone

## Method 1: iPhone Console (Best for TestFlight Apps)

### Using Mac Console App
1. **Connect iPhone to Mac** via USB cable
2. **Open Console.app** on your Mac (Applications → Utilities → Console)
3. **Select your iPhone** in the left sidebar under "Devices"
4. **Filter for your app:**
   - In the search bar, type: `jung` or `org.name.jung`
   - Or search for: `supabase` to see database-related logs
5. **Open Jung app** on your iPhone
6. **Watch live logs** appear in Console.app

### Console App Tips:
- **Start/Clear logs:** Click "Clear" before testing
- **Filter by category:** Use search terms like:
  - `jung` - All app logs
  - `supabase` - Database logs
  - `error` - Error messages only
  - `🍎` - Apple Sign In logs (if using emoji logging)
- **Save logs:** File → Export to save log file

## Method 2: iPhone Settings Analytics (For Crashes)

### View Crash Reports
1. **Settings** → **Privacy & Security** → **Analytics & Improvements**
2. **Analytics Data**
3. **Look for files starting with "jung"** or containing crash data
4. **Tap to view** crash details
5. **Share via AirDrop/Email** to save

### What to Look For:
- Exception type
- Stack trace
- Crash timestamp
- Memory usage at crash

## Method 3: Development Build with Live Logs

### Build Development Version for Better Logging
```bash
# Build development version (shows console logs)
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Start development server
npm start

# Install dev build and connect to see live logs
```

### With Development Build:
- **Real-time console logs** in your terminal
- **Better error messages** for debugging
- **Network request details** visible
- **Supabase connection status** logged

## Method 4: Remote Debugging (Development Build Only)

### Using React DevTools
1. **Install development build** on iPhone
2. **Start development server:** `npm start`
3. **Connect to Metro:** Shake device → "Debug with Chrome"
4. **Open Chrome DevTools** and view console

## What to Look For in Jung App Logs

### Supabase Connection Issues:
```
Missing Supabase environment variables
EXPO_PUBLIC_SUPABASE_URL: Missing
EXPO_PUBLIC_SUPABASE_ANON_KEY: Missing
Supabase not configured
```

### Network Timeout Errors:
```
Error: Network timeout
Supabase call failed
Auth service error
Connection failed
```

### Apple Sign In Issues:
```
🍎 Apple Sign In error
Missing Apple credentials
Apple authentication failed
```

### Authentication Flow:
```
>>> Handling Auth Redirect URL
>>> Manual setSession call successful
Session found: [user-id]
```

## Recommended Debugging Approach

### For TestFlight Apps (Production):
1. **Use Mac Console.app** (Method 1)
2. **Filter for "supabase" and "error"**
3. **Try login and watch for timeout errors**
4. **Save logs** to share if needed

### For Detailed Debugging:
1. **Build development version** (Method 3)
2. **Connect to development server**
3. **Watch real-time logs** in terminal
4. **Test login with live feedback**

## Common Log Messages and Solutions

### ✅ App Working Correctly:
```
Supabase URL: Set
Supabase Anon Key: Set (hidden)
Auth service test: OK
Basic database connectivity: OK
```

### ❌ Environment Variable Issues:
```
Missing Supabase environment variables
EXPO_PUBLIC_SUPABASE_URL: Missing
EXPO_PUBLIC_SUPABASE_ANON_KEY: Missing
```
**Fix:** Set environment variables with `eas secret:create`

### ❌ Network Timeout:
```
Network timeout
Supabase API is not responding correctly
Connection failed
```
**Fix:** Check Supabase URL and network connectivity

### ❌ Authentication Issues:
```
Auth service error
Invalid credentials
Session not found
```
**Fix:** Verify Supabase anon key and project configuration

## Quick Debug Commands

### Check EAS Environment Variables:
```bash
eas secret:list
```

### Build Development Version for Better Logging:
```bash
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios
npm start
```

### View Live Console Logs:
1. Connect iPhone to Mac
2. Open Console.app
3. Select iPhone → search "jung"
4. Open app and watch logs

## Next Steps After Getting Logs

### If you see "Missing environment variables":
1. Set Supabase credentials with `eas secret:create`
2. Rebuild production app
3. Test login again

### If you see "Network timeout":
1. Verify Supabase URL format (include https://)
2. Check Supabase project is active
3. Test with development build first

### If you see authentication errors:
1. Verify anon key (not service_role key)
2. Check Supabase project permissions
3. Test email login first (simplest)

**Start with Mac Console.app - it's the easiest way to see what's happening with your TestFlight app!**
