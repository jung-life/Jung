import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

export const testAppleSignIn = async () => {
  console.log('=== Apple Sign-In Test ===');
  console.log('Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier);
  console.log('Platform:', Platform.OS);
  console.log('iOS Version:', Platform.Version);
  
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('Apple Sign-In Available:', isAvailable);
    
    if (!isAvailable) {
      console.log('❌ Apple Sign-In not available');
      console.log('Possible reasons:');
      console.log('- Running on simulator (use real device)');
      console.log('- Not signed into iCloud');
      console.log('- 2FA not enabled');
      console.log('- iOS < 13.0');
      return false;
    }
    
    console.log('✅ Apple Sign-In is available');
    console.log('✅ Ready to test sign-in flow');
    return true;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
};
