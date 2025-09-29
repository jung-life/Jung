import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Initialize Sentry for debugging Supabase issues
export const initSentry = () => {
  Sentry.init({
    dsn: 'https://your-dsn@sentry.io/project-id', // Replace with your Sentry DSN
    environment: __DEV__ ? 'development' : 'production',
    debug: __DEV__,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeSend: (event) => {
      // Filter out sensitive information
      if (event.exception) {
        event.exception.values?.forEach(exception => {
          if (exception.stacktrace?.frames) {
            exception.stacktrace.frames.forEach(frame => {
              // Remove sensitive file paths
              if (frame.filename) {
                frame.filename = frame.filename.replace(/.*\/node_modules\//, 'node_modules/');
              }
            });
          }
        });
      }
      return event;
    }
  });

  // Set user context for debugging
  Sentry.setUser({
    id: 'anonymous',
    device: Constants.deviceName || 'unknown',
    platform: Constants.platform?.ios ? 'iOS' : 'Android',
    isDevice: Constants.isDevice
  });
};

// Enhanced error logging specifically for Supabase issues
export const logSupabaseError = (error: any, context: string, additionalData?: any) => {
  console.error(`🚨 Supabase Error [${context}]:`, error);

  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'supabase');
    scope.setContext('supabase_context', {
      operation: context,
      isDevice: Constants.isDevice,
      platform: Constants.platform?.ios ? 'iOS' : 'Android',
      ...additionalData
    });

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(`Supabase Error: ${context}`, 'error');
    }
  });
};

// Log authentication events
export const logAuthEvent = (event: string, success: boolean, details?: any) => {
  console.log(`🔐 Auth Event [${event}]: ${success ? 'SUCCESS' : 'FAILED'}`, details);

  Sentry.addBreadcrumb({
    message: `Auth: ${event}`,
    category: 'auth',
    level: success ? 'info' : 'error',
    data: {
      success,
      isDevice: Constants.isDevice,
      ...details
    }
  });

  if (!success) {
    Sentry.withScope((scope) => {
      scope.setTag('auth_event', event);
      scope.setLevel('warning');
      Sentry.captureMessage(`Authentication failed: ${event}`, 'warning');
    });
  }
};

// Log environment variable issues
export const logEnvironmentIssues = (missingVars: string[]) => {
  if (missingVars.length > 0) {
    console.error('🚨 Missing Environment Variables:', missingVars);

    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'environment');
      scope.setContext('environment_issues', {
        missingVariables: missingVars,
        isDevice: Constants.isDevice
      });
      Sentry.captureMessage(`Missing environment variables: ${missingVars.join(', ')}`, 'error');
    });
  }
};

// Performance monitoring for authentication
export const measureAuthPerformance = (operation: string) => {
  const transaction = Sentry.startTransaction({
    name: `auth_${operation}`,
    op: 'authentication'
  });

  return {
    finish: (success: boolean, error?: any) => {
      transaction.setTag('success', success);
      if (error) {
        transaction.setTag('error', error.message || 'Unknown error');
      }
      transaction.finish();
    }
  };
};

export default Sentry;