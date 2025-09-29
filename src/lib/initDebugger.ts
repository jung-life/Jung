import { appLogger } from './debugger';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Initialize debugging system
export const initializeDebugging = () => {
  console.log('🔧 Initializing enhanced debugging system...');

  // Log system info for debugging
  appLogger.supabaseSuccess('System Init', {
    platform: Platform.OS,
    isDevice: Constants.isDevice,
    deviceName: Constants.deviceName,
    appVersion: Constants.expoConfig?.version,
    executionEnvironment: Constants.executionEnvironment,
    timestamp: new Date().toISOString()
  });

  // Test basic functionality
  appLogger.authAttempt('System', { test: true });

  console.log('✅ Enhanced debugging system initialized');
  console.log('👆 Tap 5 times in top-right corner to access debug logs');
};

// Export logger for use in other files
export { appLogger };
export default initializeDebugging;