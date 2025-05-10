import 'dotenv/config';

export default ({ config }) => {
  // Ensure nested structures exist before assigning
  config.ios = config.ios || {};
  config.ios.config = config.ios.config || {};
  config.ios.config.googleSignIn = config.ios.config.googleSignIn || {};
  config.ios.infoPlist = config.ios.infoPlist || {}; // Ensure infoPlist exists

  config.android = config.android || {}; // Ensure android config exists

  // Read the iOS Google Client ID from environment variables
  const iosGoogleClientId = process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID;

  // Assign the environment variable to the correct config path
  if (iosGoogleClientId) {
    config.ios.config.googleSignIn.reservedClientId = iosGoogleClientId;
  } else {
    // Keep the placeholder or warn if the env var is missing in production builds
    console.warn('EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID environment variable is not set. Google Sign-In on iOS might not work.');
    // Optionally keep the placeholder from app.json if not set, 
    // or explicitly set it to undefined/null if that's preferred.
    // config.ios.config.googleSignIn.reservedClientId = config.ios.config.googleSignIn.reservedClientId || 'YOUR_PLACEHOLDER_ID'; 
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
    "This app uses your location to provide relevant features and enhance your experience. For example, location data may be used to personalize content or features based on your general area.";
  // You can also add NSLocationAlwaysAndWhenInUseUsageDescription if background location is needed:
  // config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription = "Your message for always and when in use location permission";


  // You can keep the existing extra config if needed for other purposes
  config.extra = {
    ...config.extra,
    // You might want a general Google Client ID here too, perhaps for web?
    // googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, 
  };

  return config; // Return the modified config object
};
