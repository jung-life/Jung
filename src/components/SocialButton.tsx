import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
// Import icons from phosphor-react-native
import { Envelope, GoogleLogo, AppleLogo } from 'phosphor-react-native'; 
import tw from '../lib/tailwind';

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
  
  // Define button content based on provider
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getLoadingColor()} />;
    }
    
    switch(provider) {
      case 'google':
        return (
          <>
            <GoogleLogo size={22} color="#DB4437" weight="bold" style={tw`mr-3`} />
            <Text style={tw`font-medium text-base ${colors.text}`}>Sign in with Google</Text>
          </>
        );
      case 'apple':
        return (
          <>
            <AppleLogo size={22} color="#000000" weight="fill" style={tw`mr-3`} />
            <Text style={tw`font-medium text-base ${colors.text}`}>Sign in with Apple</Text>
          </>
        );
      case 'email':
        return (
          <>
            <Envelope size={22} color="#6A8EAE" weight="bold" style={tw`mr-3`} /> 
            <Text style={tw`font-medium text-base ${colors.text}`}>Sign in with Email</Text>
          </>
        );
      default:
        return <Text style={tw`font-medium text-base ${colors.text}`}>Continue</Text>;
    }
  };
  
  // Get appropriate loading color based on provider
  const getLoadingColor = () => {
    switch(provider) {
      case 'google': return '#DB4437';
      case 'apple': return '#000';
      case 'email': return '#6A8EAE';
      default: return '#6A8EAE';
    }
  };
  
  return (
    <TouchableOpacity 
      style={tw`${colors.bg} border ${colors.border} rounded-xl py-3.5 px-4 mb-3 shadow-sm flex-row items-center justify-center ${disabled ? 'opacity-60' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
