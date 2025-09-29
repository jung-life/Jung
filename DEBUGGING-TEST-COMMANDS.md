# Debugging System Test Commands

## 🚀 Quick Start Testing

### 1. Build with Enhanced Debugging
```bash
# Install debugging dependencies
npm install

# Build for device with debugging enabled
npx expo run:ios --device
```

### 2. Access Debug Logs

#### Method A: Hidden Gesture (Recommended)
1. Open your app on device
2. Tap **5 times quickly** in the top-right corner
3. Select "Open Debug" from the alert
4. View real-time logs and errors

#### Method B: Console Logs
```bash
# Monitor logs in real-time with filters
npx expo logs --platform ios | grep -E "🚨|⚠️|ℹ️|🔍|🍎|🔵|📧"

# Filter specific categories
npx expo logs --platform ios | grep "🚨.*supabase"  # Supabase errors
npx expo logs --platform ios | grep "🍎"           # Apple Sign-In
npx expo logs --platform ios | grep "🔵"           # Google Sign-In
npx expo logs --platform ios | grep "📧"           # Email auth
```

#### Method C: Export Debug Data
```javascript
// Add this to any screen to export logs
import { appLogger } from '../lib/debugger';

const exportLogs = async () => {
  const data = await appLogger.exportLogs();
  console.log('DEBUG EXPORT:', data);
};
```

## 🔧 Testing Scenarios

### Test 1: Environment Variables
```bash
# Test environment loading
node -e "
require('dotenv').config();
const vars = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'];
vars.forEach(v => console.log(v + ':', process.env[v] ? '✅' : '❌'));
"
```

**Expected Debug Logs:**
```
ℹ️ [environment] All environment variables present
```

### Test 2: Supabase Connection
```bash
# Test basic Supabase connectivity
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbWhlc21ydnh1c2NramZ4dWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3Njc4NTUsImV4cCI6MjA1NTM0Mzg1NX0.E-Camc8evN4ZxY3SFqJe8WDjIRdfImKJaxDhi_JHRGM" "https://osmhesmrvxusckjfxugr.supabase.co/auth/v1/settings"
```

**Expected Debug Logs:**
```
ℹ️ [supabase] getSession succeeded
ℹ️ [network] GET https://osmhesmrvxusckjfxugr.supabase.co/auth/v1/settings
```

### Test 3: Apple Sign-In
1. **Test Service ID Mismatch**:
   - Try Apple Sign-In on device
   - Should see detailed error message

**Expected Debug Logs:**
```
ℹ️ [auth] Attempting Apple authentication
🚨 [supabase] Apple Sign-In failed
🚨 [auth] Apple authentication failed
```

2. **Fix Service ID**:
   - Go to Supabase Dashboard → Auth → Providers → Apple
   - Change Service ID to: `org.name.jung`
   - Test again

**Expected Debug Logs:**
```
ℹ️ [auth] Attempting Apple authentication
ℹ️ [supabase] Apple Sign-In succeeded
ℹ️ [auth] Apple authentication successful
```

### Test 4: Google Sign-In
1. **Test Configuration**:
   - Try Google Sign-In on device

**Expected Debug Logs:**
```
ℹ️ [auth] Attempting Google authentication
ℹ️ [supabase] Google Sign-In succeeded
ℹ️ [auth] Google authentication successful
```

### Test 5: Storage Operations
1. **Test SecureStore**:
   - Log in with any method
   - Check storage operations

**Expected Debug Logs:**
```
ℹ️ [storage] setItem sb-auth-token succeeded
ℹ️ [storage] getItem sb-auth-token succeeded
```

## 🔍 Debug Log Categories

### Supabase Category
- `supabase` - All Supabase operations
- Look for: connection errors, authentication failures, API errors

### Authentication Category
- `auth` - Authentication attempts and results
- Look for: login failures, token issues, session problems

### Storage Category
- `storage` - SecureStore and AsyncStorage operations
- Look for: storage failures, fallback usage

### Network Category
- `network` - HTTP requests and responses
- Look for: connectivity issues, API timeouts

### Environment Category
- `environment` - Environment variable validation
- Look for: missing variables, configuration errors

### Performance Category
- `performance` - Timing information
- Look for: slow operations, bottlenecks

## 🚨 Common Issues & Debug Patterns

### Issue 1: "Unacceptable audience" Error
**Debug Pattern:**
```
🚨 [supabase] Apple Sign-In failed: { "error": "Unacceptable audience in id_token: [org.name.jung]" }
🚨 [auth] Apple authentication failed
```

**Fix:** Update Supabase Service ID to match Bundle ID

### Issue 2: Environment Variables Missing
**Debug Pattern:**
```
🚨 [environment] Missing environment variables: ["EXPO_PUBLIC_SUPABASE_URL"]
🚨 [supabase] createClient failed: Supabase client not available
```

**Fix:** Check .env file and rebuild app

### Issue 3: Storage Fallback
**Debug Pattern:**
```
🚨 [storage] setItem sb-auth-token failed: SecureStore error
ℹ️ [storage] setItem sb-auth-token succeeded (AsyncStorage fallback)
```

**Status:** Working correctly with fallback

### Issue 4: Network Connectivity
**Debug Pattern:**
```
🚨 [network] GET https://osmhesmrvxusckjfxugr.supabase.co/auth/v1/health failed
🚨 [supabase] getSession failed: Network error
```

**Fix:** Check device network connection

## 📊 Performance Monitoring

### Expected Timing Benchmarks
- **Apple Sign-In**: < 3000ms
- **Google Sign-In**: < 2000ms
- **Session Check**: < 500ms
- **Storage Operations**: < 100ms

### Monitor Performance Logs
```bash
# Filter performance logs
npx expo logs --platform ios | grep "performance.*took"
```

**Example Output:**
```
ℹ️ [performance] Apple Sign-In took 2150ms
ℹ️ [performance] Session check took 245ms
```

## 🔄 Real-Time Monitoring

### Auto-Refreshing Debug Screen
1. Open debug screen (5 taps in top-right)
2. Enable "Auto-refresh logs" toggle
3. Watch logs update every 3 seconds
4. Filter by category for focused debugging

### Export Debug Data
1. In debug screen, tap export button
2. Share logs via email, messages, or save to files
3. Send to developer for analysis

### Clear Debug Data
1. In debug screen, tap trash button
2. Confirm to clear all stored debug logs
3. Fresh start for new debugging session

## 🎯 Success Indicators

### ✅ Working Correctly
- Environment variables all present
- Supabase client creates successfully
- Authentication completes without errors
- Storage operations succeed
- Session persists across app restarts

### ⚠️ Issues Detected
- Specific error messages in debug logs
- Failed authentication attempts logged
- Storage fallback operations
- Network connectivity problems
- Performance bottlenecks identified

### 🚨 Critical Problems
- Multiple consecutive authentication failures
- Persistent storage errors
- Environment configuration missing
- Network timeouts
- App crashes with debug traces

## 🔧 Advanced Debugging

### Test Specific Functions
```javascript
// Test Supabase connection
import { appLogger } from '../lib/debugger';
import { supabase } from '../lib/supabase';

const testConnection = async () => {
  const timer = appLogger.startTiming('Connection Test');
  try {
    const { data, error } = await supabase.auth.getSession();
    appLogger.supabaseSuccess('Connection Test', { hasSession: !!data.session });
    timer.end(true);
  } catch (error) {
    appLogger.supabaseError('Connection Test', error);
    timer.end(false, error);
  }
};
```

### Monitor Specific Issues
```bash
# Watch for specific error patterns
npx expo logs --platform ios | grep -i "audience\|service.*id\|bundle.*id"
npx expo logs --platform ios | grep -i "missing\|not.*found\|undefined"
npx expo logs --platform ios | grep -i "network\|timeout\|connection"
```

This debugging system provides comprehensive monitoring and troubleshooting capabilities for your Supabase authentication issues on physical devices.