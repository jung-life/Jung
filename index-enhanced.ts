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
