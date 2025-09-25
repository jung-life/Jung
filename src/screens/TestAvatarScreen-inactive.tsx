import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import TestRogersAvatar from '../components/TestRogersAvatar';

/**
 * A screen to test the Carl Rogers avatar
 */
const TestAvatarScreen = () => {
  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <TestRogersAvatar />
      </SafeAreaView>
    </GradientBackground>
  );
};

export default TestAvatarScreen;
