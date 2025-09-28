import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafePhosphorIcon } from './SafePhosphorIcon';
import tw from '../lib/tailwind';

interface NavigationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface NavigationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    // Check if this is a navigation-related error
    if (error.message?.includes('RESET') ||
        error.message?.includes('not handled by any navigator') ||
        error.message?.includes('navigation')) {
      console.error('Navigation Error Caught:', error);
      return { hasError: true, error };
    }

    // Re-throw non-navigation errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('NavigationErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultNavigationErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultNavigationErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultNavigationErrorFallback: React.FC<DefaultNavigationErrorFallbackProps> = ({
  error,
  resetError
}) => (
  <View style={tw`flex-1 justify-center items-center bg-white px-6`}>
    <View style={tw`items-center`}>
      <View style={tw`bg-red-100 rounded-full p-4 mb-4`}>
        <SafePhosphorIcon iconType="Warning" size={48} color="#DC2626" weight="bold" />
      </View>

      <Text style={tw`text-xl font-bold text-gray-800 mb-2 text-center`}>
        Navigation Error
      </Text>

      <Text style={tw`text-gray-600 text-center mb-6 leading-6`}>
        There was an issue with navigation. This usually resolves automatically.
      </Text>

      {error && __DEV__ && (
        <View style={tw`bg-gray-100 rounded-lg p-4 mb-6 w-full max-w-sm`}>
          <Text style={tw`text-xs text-gray-700 font-mono`}>
            Debug: {error.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={resetError}
        style={tw`bg-jung-purple rounded-xl py-4 px-6`}
      >
        <Text style={tw`text-white font-bold text-center`}>
          Try Again
        </Text>
      </TouchableOpacity>

      <Text style={tw`text-xs text-gray-500 mt-4 text-center`}>
        If this persists, please restart the app
      </Text>
    </View>
  </View>
);