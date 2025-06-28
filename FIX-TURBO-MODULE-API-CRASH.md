# Fix Turbo Module Manager API Crash

## Exact Issue Identified ✅
Your crash log shows the app is crashing in React Native's Turbo Module Manager due to API call failures. This happens when API keys are missing in production builds.

## Root Cause
TestFlight builds don't have access to your local `.env` file, causing API calls to fail and crash the app.

## Immediate Fixes

### Fix 1: Set Production Environment Variables

#### Option A: EAS Secrets (Recommended)
```bash
# Set all required API keys for production
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-production-supabase-key"
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "your-production-anthropic-key"
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-production-openai-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "your-api-url"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_CLIENT_ID --value "your-google-client-id"

# Check what's currently set
eas secret:list
```

#### Option B: Update app.json with Production Keys
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "c4f0be2f-a422-489b-acda-4d2be4769a36"
      },
      "SUPABASE_URL": "your-production-supabase-url",
      "SUPABASE_ANON_KEY": "your-production-supabase-key",
      "ANTHROPIC_API_KEY": "your-production-anthropic-key"
    }
  }
}
```

### Fix 2: Add Error Handling to Prevent Crashes

#### Update Supabase Configuration
```typescript
// In your lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Add safety checks
if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Create client only if both values exist
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Add a safety wrapper for all Supabase calls
export const safeSupabaseCall = async (operation: () => Promise<any>) => {
  if (!supabase) {
    console.error('Supabase not configured');
    return { data: null, error: { message: 'Database not available' } };
  }
  
  try {
    return await operation();
  } catch (error) {
    console.error('Supabase call failed:', error);
    return { data: null, error };
  }
};
```

#### Add API Error Handling
```typescript
// Add this to your API calling code
export const callAnthropicAPI = async (message: string) => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('Missing Anthropic API key');
      return { 
        error: 'API configuration error',
        content: [{ text: 'I apologize, but I cannot process your request right now. Please check your internet connection and try again.' }]
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Anthropic API call failed:', error);
    // Return a fallback response instead of crashing
    return { 
      error: 'Service temporarily unavailable',
      content: [{ text: 'I apologize, but I cannot process your request right now. Please try again later.' }]
    };
  }
};
```

### Fix 3: Add Environment Check in App.tsx

Add this to your main App.tsx to catch missing environment variables early:

```typescript
// Add to the top of your App.tsx
import { Alert } from 'react-native';

const checkEnvironmentVariables = () => {
  const requiredVars = {
    'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'EXPO_PUBLIC_ANTHROPIC_API_KEY': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    
    if (__DEV__) {
      Alert.alert(
        'Configuration Error',
        `Missing environment variables: ${missingVars.join(', ')}`
      );
    }
    
    return false;
  }
  
  return true;
};

// In your App component
export default function App() {
  React.useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  // Rest of your app...
}
```

### Fix 4: Add Crash-Safe Error Boundary

```typescript
// Create ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please restart the app.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text style={styles.error}>
              Error: {this.state.error?.message}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 20,
    textAlign: 'center',
  },
});

// Then wrap your App
import { ErrorBoundary } from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      {/* Your existing app content */}
    </ErrorBoundary>
  );
}
```

## Rebuild Steps

### 1. Set Environment Variables
```bash
# Set all your production API keys
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key"
eas secret:create --scope project --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value "your-key"
```

### 2. Update Code with Error Handling
- Add the error boundary
- Update API calls with try-catch blocks
- Add environment variable checks

### 3. Rebuild and Submit
```bash
# Rebuild with the fixes
EXPO_NO_CAPABILITY_SYNC=1 eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios
```

## Testing Before Production

### Test Locally with Production Configuration
```bash
# Test locally with production keys to verify they work
expo run:ios --configuration Release
```

### Verify Environment Variables
```bash
# Check that all secrets are set
eas secret:list
```

## Expected Results

### ✅ After Fixes:
- App launches successfully in TestFlight
- API calls work with production keys
- Graceful error handling if APIs are unavailable
- No more Turbo Module Manager crashes

### 🔧 If Still Crashing:
- Check EAS build logs for missing variables
- Test individual API endpoints
- Add more specific error logging

This should completely resolve your Turbo Module Manager crash!
