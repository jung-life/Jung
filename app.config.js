import 'dotenv/config';

export default ({ config }) => {
  // Enhanced environment variable handling for physical devices
  console.log('🔧 App Config: Processing environment variables...');

  // Ensure nested structures exist before assigning
  config.ios = config.ios || {};
  config.ios.config = config.ios.config || {};
  config.ios.config.googleSignIn = config.ios.config.googleSignIn || {};
  config.ios.infoPlist = config.ios.infoPlist || {};

  config.android = config.android || {};

  // Enhanced environment variable collection
  const environmentVars = {
    // Supabase configuration
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_STORAGE_URL: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_URL,

    // Google OAuth configuration
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID,

    // API Keys
    EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,

    // RevenueCat configuration
    EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
    EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
    EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID,
  };

  // Log environment variable status (without exposing sensitive data)
  Object.entries(environmentVars).forEach(([key, value]) => {
    if (value) {
      console.log(`🔧 ${key}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.warn(`🔧 ${key}: NOT SET`);
    }
  });

  // Configure Google Sign-In for iOS
  const iosGoogleClientId = environmentVars.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID;
  if (iosGoogleClientId) {
    config.ios.config.googleSignIn.reservedClientId = iosGoogleClientId;
    console.log('🔧 iOS Google Client ID configured');
  } else {
    console.warn('🔧 EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID environment variable is not set. Google Sign-In on iOS might not work.');
  }

  // Add location permissions
  // For Android:
  config.android.permissions = [
    ...(config.android.permissions || []), // Spread existing permissions if any
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION"
  ];

  // For iOS:
  config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
    "Jung needs your location to provide personalized mental health support and track your mood patterns in different environments.";
  config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
    "Jung needs your location to provide personalized mental health support and track your mood patterns in different environments, even when the app is in the background.";
  config.ios.infoPlist.NSLocationAlwaysUsageDescription =
    "Jung needs your location to provide personalized mental health support and track your mood patterns in different environments, even when the app is in the background.";

  // Add App Transport Security exception for Supabase
  config.ios.infoPlist.NSAppTransportSecurity = {
    NSExceptionDomains: {
      "supabase.co": {
        NSIncludesSubdomains: true,
        NSExceptionAllowsInsecureHTTPLoads: false
      }
    }
  };


  // Enhanced extra config for physical device environment variable access
  const originalExtra = { ...config.extra }; // Preserve original extra from app.json

  config.extra = {
    ...originalExtra, // Start with original extra
    // Add all environment variables to extra for physical device access
    ...environmentVars,
    // Physical device debugging info
    buildTime: new Date().toISOString(),
    configVersion: '2.0.0'
  };

  console.log('🔧 Environment variables added to config.extra for physical device access');

  // Ensure EAS projectId from app.json (via originalExtra) is correctly set
  if (originalExtra?.eas?.projectId) {
    config.extra.eas = {
      ...config.extra.eas, // Spread any other dynamic EAS config
      projectId: originalExtra.eas.projectId, // Explicitly set projectId from original
    };
  }
  
  // If you have an environment variable to override projectId, you can do it here:
  // if (process.env.EAS_PROJECT_ID) {
  //   config.extra.eas = config.extra.eas || {};
  //   config.extra.eas.projectId = process.env.EAS_PROJECT_ID;
  // }

  return config; // Return the modified config object
};
