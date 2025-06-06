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
