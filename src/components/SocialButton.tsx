
import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet, Image } from 'react-native';
// Import icons from phosphor-react-native
import { Envelope, GoogleLogo, AppleLogo } from 'phosphor-react-native'; 
import tw from '../lib/tailwind';
import Svg, { Path } from 'react-native-svg';

type Provider = 'google' | 'apple' | 'email';

type SocialButtonProps = {
  onPress: () => void;
  provider: Provider;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'conversation' | 'motivation' | 'emotional';
};

export const SocialButton = ({ 
  onPress, 
  provider,
  loading = false,
  disabled = false,
  variant = 'default'
}: SocialButtonProps) => {
  
  // Define color schemes for different variants
  const getColors = () => {
    switch(variant) {
      case 'conversation':
        return { bg: 'bg-soothing-blue/20', border: 'border-conversation', text: 'text-gray-700' };
      case 'motivation':
        return { bg: 'bg-soothing-green/20', border: 'border-motivation', text: 'text-gray-700' };
      case 'emotional':
        return { bg: 'bg-soothing-lavender/20', border: 'border-emotional', text: 'text-gray-700' };
      default:
        return { bg: 'bg-white/90', border: 'border-soothing-blue', text: 'text-gray-700' };
    }
  };
  
  const colors = getColors();
  
  // Google's official "G" logo component
  const GoogleGLogo = () => (
    <View style={tw`w-5 h-5 mr-3 items-center justify-center`}>
      <Svg width="20" height="20" viewBox="0 0 48 48">
        <Path 
          fill="#EA4335" 
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <Path 
          fill="#4285F4" 
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <Path 
          fill="#FBBC05" 
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <Path 
          fill="#34A853" 
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
        <Path fill="none" d="M0 0h48v48H0z" />
      </Svg>
    </View>
  );

  // Define button content based on provider
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getLoadingColor()} />;
    }
    
    switch(provider) {
      case 'google':
        return (
          <>
            <GoogleGLogo />
            <Text style={tw`font-medium text-base text-white`}>Sign in with Google</Text>
          </>
        );
      case 'apple':
        return (
          <>
            <AppleLogo size={22} color="#FFFFFF" weight="fill" style={tw`mr-3`} />
            <Text style={tw`font-medium text-base text-white`}>Sign in with Apple</Text>
          </>
        );
      case 'email':
        return (
          <>
            <Envelope size={22} color="#FFFFFF" weight="bold" style={tw`mr-3`} /> 
            <Text style={tw`font-medium text-base text-white`}>Sign in with Email</Text>
          </>
        );
      default:
        return <Text style={tw`font-medium text-base ${colors.text}`}>Continue</Text>;
    }
  };
  
  // Get appropriate loading color based on provider
  const getLoadingColor = () => {
    switch(provider) {
      case 'google': return '#4285F4'; // Google's primary blue color
      case 'apple': return '#000';
      case 'email': return '#6A8EAE';
      default: return '#6A8EAE';
    }
  };
  
  // Standardized styling for all buttons - exact same size with increased height for text visibility
  const getButtonStyle = () => {
    const baseStyle = `rounded-xl py-4 px-4 mb-3 shadow-sm flex-row items-center justify-center h-14 min-w-full ${disabled ? 'opacity-60' : ''}`;
    
    if (provider === 'apple') {
      return tw`bg-black ${baseStyle}`;
    }
    if (provider === 'google') {
      return tw`bg-gray-800 ${baseStyle}`;
    }
    // Email button with same dark background as Google/Apple buttons
    return tw`bg-gray-700 ${baseStyle}`;
  };

  return (
    <TouchableOpacity 
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
