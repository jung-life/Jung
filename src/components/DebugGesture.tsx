import React, { useState } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

// Hidden debug access component
export const DebugGesture: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation();
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  const handleQuickTaps = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(1);
    }

    setLastTap(now);

    // 5 quick taps to open debug screen
    if (tapCount >= 4) {
      setTapCount(0);

      Alert.alert(
        'Debug Mode',
        'Access debug logs and monitoring?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Debug',
            onPress: () => {
              // Navigate to debug screen
              (navigation as any).navigate('DebugScreen');
            }
          }
        ]
      );
    }

    // Reset tap count after delay
    setTimeout(() => {
      setTapCount(0);
    }, 2000);
  };

  // Only show debug gesture in development or on test devices
  if (!__DEV__ && Constants.isDevice) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {/* Invisible debug trigger - top right corner */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          width: 50,
          height: 50,
          backgroundColor: 'transparent',
        }}
        onPress={handleQuickTaps}
        activeOpacity={1}
      />
    </View>
  );
};