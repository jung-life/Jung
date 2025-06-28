# Fix TestFlight App Crashes

## App Crashes on iPhone - Troubleshooting Guide

Congratulations on getting your app into TestFlight! App crashes are common and usually fixable. Let's diagnose and fix the issue.

## Immediate Steps to Debug

### Step 1: Get Crash Logs from TestFlight

#### Option A: Check TestFlight Crash Reports
1. **Open TestFlight app** on your iPhone
2. **Find your "jung" app**
3. **Tap "Send Beta Feedback"**
4. **Look for crash reports** - TestFlight often shows crash details
5. **Send feedback** with crash info if available

#### Option B: iPhone Settings Crash Logs
1. **Settings** → **Privacy & Security** → **Analytics & Improvements**
2. **Analytics Data**
3. **Look for "jung" crash logs**
4. **Share the crash log** (you can email it to yourself)

### Step 2: Common Production Build Crash Causes

#### ⚠️ **Missing Environment Variables**
Production builds don't have access to your local `.env` file.

**Check your code for:**
```typescript
// These will be undefined in production if not properly configured
process.env.EXPO_PUBLIC_SUPABASE_URL
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
```

**Fix:** Ensure all environment variables are set in EAS secrets:
```bash
# Set environment variables for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-supabase-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
```

#### ⚠️ **Bundle/Import Issues**
Production builds are more strict about imports and bundle sizes.

**Common issues:**
- Missing packages in production
- Dynamic imports not properly handled
- Large bundle causing memory issues

#### ⚠️ **Native Module Issues**
Some native modules behave differently in production.

**Common culprits:**
- `expo-secure-store`
- `expo-apple-authentication`
- `@react-native-google-signin/google-signin`

### Step 3: Quick Fixes to Try

#### Fix 1: Add Error Boundaries
Update your main App component to catch crashes:

```typescript
// Add to your App.tsx
import React from 'react';
import { Text, View } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>App Error</Text>
          <Text style={{ fontSize: 14, textAlign: 'center' }}>
            The app encountered an error. Please restart the app.
          </Text>
          <Text style={{ fontSize: 12, marginTop: 10, color: 'gray' }}>
            Error: {this.state.error?.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrap your main app component
export default function App() {
  return (
    <ErrorBoundary>
      {/* Your existing app content */}
    </ErrorBoundary>
  );
}
```

#### Fix 2: Add Environment Variable Checks
Add safety checks for required environment variables:

```typescript
// Add to your App.tsx or main entry point
const requiredEnvVars = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing environment variables:', missingVars);
  // Show error screen instead of crashing
}
```

#### Fix 3: Simplify Entry Point
Create a minimal version to test if it's a specific component causing crashes:

```typescript
// Temporarily simplify your App.tsx to test
export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Jung App - Basic Version</Text>
      <Text>If you see this, the app launches successfully</Text>
    </View>
  );
}
```

## Environment Variables Setup for Production

### Check Current EAS Secrets
```bash
# List current secrets
eas secret:list
```

### Add Missing Secrets
```bash
# Add all required environment variables
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "your-google-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "your-api-url"
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "your-anthropic-key"
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-openai-key"
```

## Debugging Steps

### Step 1: Test Development Build First
Before fixing production, test with development build:

```bash
# Build development version that connects to development server
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile development --platform ios

# Install and test with development server running
npm start
```

If development build works but production crashes, it's likely an environment variable or bundle issue.

### Step 2: Check Logs in EAS Dashboard
1. Go to https://expo.dev/accounts/infinitydata.ai/projects/jung/builds
2. Find your production build
3. Check build logs for any warnings or errors
4. Look for missing dependencies or configuration issues

### Step 3: Incremental Testing
Build a minimal version and gradually add features:

1. **Basic app** - Just shows text
2. **Add navigation** - Test if routing works
3. **Add Supabase** - Test if database connection works
4. **Add authentication** - Test if login works
5. **Add all features** - Full app functionality

## Common Crash Scenarios

### Crash on Launch
**Likely causes:**
- Missing environment variables
- Bad imports in App.tsx
- Native module initialization issues

**Fix:** Add error boundary and env var checks

### Crash on Login Screen
**Likely causes:**
- Supabase configuration issues
- Missing authentication dependencies
- Apple Sign In not properly configured

**Fix:** Check Apple Developer Console capabilities

### Crash on Specific Features
**Likely causes:**
- Missing API keys
- Network connectivity issues
- Component-specific bugs

**Fix:** Add try-catch blocks around feature code

## Emergency Fix: Minimal App Version

If crashes persist, build a minimal version to get TestFlight working:

```typescript
// Minimal App.tsx for emergency release
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Jung AI</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          We're working on bringing you the best AI mental health companion.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
});
```

## Next Steps

### Immediate Actions:
1. **Get crash logs** from TestFlight or iPhone Settings
2. **Check environment variables** are set in EAS
3. **Build development version** to compare behavior
4. **Add error boundary** to catch crashes gracefully

### If Crashes Persist:
1. **Build minimal version** to confirm basic functionality
2. **Gradually add features** to isolate the crash cause
3. **Test each component** individually

### Long-term Solutions:
1. **Implement comprehensive error handling**
2. **Add crash reporting** (like Sentry)
3. **Set up proper testing** before production builds

Share the crash logs when you get them, and we can provide more specific fixes!
