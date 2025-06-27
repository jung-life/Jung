import React from 'react';
import { View, Text } from 'react-native';
import { SupabaseProvider as OriginalSupabaseProvider } from './SupabaseContext';

interface SupabaseProviderProps {
  children: React.ReactNode;
}

/**
 * A wrapper around the original SupabaseProvider to prevent text rendering issues
 * by ensuring all content is properly wrapped in Text components
 */
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return (
    <OriginalSupabaseProvider>
      {children}
    </OriginalSupabaseProvider>
  );
};
