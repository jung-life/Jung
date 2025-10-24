// Import the polyfill for crypto.getRandomValues at the very top
import 'react-native-get-random-values';

// Enhanced version of the app
import { registerRootComponent } from 'expo';
import EnhancedApp from './src/App-enhanced';

// Register the enhanced version of the app
registerRootComponent(EnhancedApp);
