// Root App.tsx - Make it a simple re-export
import App from './src/App';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://764bd8dc199280a8ca908f22f27fd64f@o4510156912656384.ingest.us.sentry.io/4510156916195328',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});
export default Sentry.wrap(App);