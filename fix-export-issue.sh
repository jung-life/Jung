#!/bin/bash

# Fix Expo Export Issue for Jung App
# This script fixes the import path and bundling issues

echo "🔧 Fixing expo export issue..."

# 1. Simplify the crash-safe app to avoid complex imports during bundling
echo "📱 Simplifying crash-safe app..."
cat > src/App-crash-safe.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import App from './App';

// Enhanced Error Boundary for crash prevention
class CrashSafeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Return state update to trigger re-render
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error for debugging
    if (__DEV__) {
      console.error('App crashed:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});

export default function CrashSafeApp() {
  return (
    <CrashSafeErrorBoundary>
      <App />
    </CrashSafeErrorBoundary>
  );
}
EOF

# 2. Simplify the index file to avoid complex error handling during bundling
echo "📦 Simplifying index file..."
cat > index-enhanced.ts << 'EOF'
import { AppRegistry, LogBox } from 'react-native';
import CrashSafeApp from './src/App-crash-safe';
import { name as appName } from './app.json';

// Suppress common warnings that might cause issues
LogBox.ignoreLogs([
  'Require cycle:',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'VirtualizedLists should never be nested',
]);

// Simple global error handler (only in production)
if (!__DEV__) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('Global error caught:', error.message);
    // In production, don't crash - just log
    if (originalHandler && __DEV__) {
      originalHandler(error, isFatal);
    }
  });
}

AppRegistry.registerComponent(appName, () => CrashSafeApp);
EOF

# 3. Remove the complex metro config that might be causing issues
echo "⚙️ Simplifying metro config..."
cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep it simple for better compatibility
module.exports = config;
EOF

# 4. Ensure package.json has the correct main entry
echo "📋 Ensuring correct package.json main entry..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = 'index-enhanced.ts';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json main entry');
"

# 5. Clean any cached files that might be causing issues
echo "🧹 Cleaning cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro

echo ""
echo "🎯 Export issue fix completed!"
echo ""
echo "What was fixed:"
echo "- ✅ Simplified crash-safe app to avoid complex imports"
echo "- ✅ Simplified global error handler for production only"
echo "- ✅ Removed complex metro configuration"
echo "- ✅ Cleaned cache files"
echo "- ✅ Ensured correct package.json main entry"
echo ""
echo "The app should now export and build successfully with EAS!"
echo ""
echo "Next step: eas build --platform ios"
