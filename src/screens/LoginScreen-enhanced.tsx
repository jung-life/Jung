import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Lock, Envelope } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import { SocialButton } from '../components/SocialButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import tw from '../lib/tailwind';

// Import both Supabase clients and functions
import { supabase, storeAuthData } from '../lib/supabase';
import { 
  supabaseEnhanced, 
  storeAuthDataEnhanced, 
  checkSessionEnhanced 
} from '../lib/supabase-enhanced';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

export const LoginScreenEnhanced = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Removed initializing state
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'default' | 'conversation' | 'motivation' | 'emotional'>('default');
  
  // Get Google Client ID from environment variables
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                        '';

  // Removed initial session check useEffect hook.
  // The listener below handles navigation if a session exists.

  // Effect to listen for auth state changes and handle navigation
  useEffect(() => {
    // Check session immediately upon listener setup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // No need to navigate here, App-enhanced.tsx handles initial routing based on session
        console.log('Existing session found on mount. App-enhanced will handle navigation.');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change (standard client):', event, !!session);
      
      // Navigate on SIGNED_IN - Let App-enhanced.tsx handle this based on session state change
      if (event === 'SIGNED_IN' && session) {
         console.log('User signed in via listener. App-enhanced will handle navigation.');
         // No explicit navigation needed here.
      }
      // Removed initializing state update

      // Handle SIGNED_OUT if needed (e.g., navigate back to login)
      // if (event === 'SIGNED_OUT') {
      //   navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); // Or appropriate screen
      // }
    });

    return () => {
      console.log("Unsubscribing auth listener");
      authListener.subscription.unsubscribe();
    };
  }, [navigation]); // Dependency on navigation only

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Attempting email login with standard client...');
      // Use standard Supabase email/password sign-in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login failed:', error.message);
        setErrorMessage(error.message || 'Login failed. Please check your credentials and try again.');
        Alert.alert('Login Error', error.message || 'Login failed. Please check your credentials and try again.');
        return; 
      }
      
      console.log('Email login initiated successfully.');
      // Navigation will be handled by the onAuthStateChange listener upon successful sign-in
    } catch (error) {
      console.error('Unexpected email login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred during email login';
      setErrorMessage(errorMsg);
      Alert.alert('Login Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      console.log('Starting Google login flow with standard client...');
      
      // Get the redirect URI - explicitly set scheme to match app.json
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'jung',
        preferLocalhost: true
      });
      console.log('Using redirect URI:', redirectUri);
      
      // Use the standard Supabase client
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('Supabase OAuth error (standard client):', error);
        setErrorMessage(error.message);
        Alert.alert('Login Error', error.message);
        setLoading(false); // Ensure loading stops on error
        return;
      }

      if (data?.url) {
        console.log('Opening auth URL (standard client):', data.url);
        
        // Open the URL in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        console.log('WebBrowser result (standard client):', JSON.stringify(result));
        
        // Handle the WebBrowser result
        if (result.type === 'success') {
          console.log('OAuth flow completed successfully');
          
          // Check if there's an error in the URL
          const resultUrl = result.url || '';
          if (resultUrl.includes('error=')) {
            console.warn('Error found in redirect URL:', resultUrl);
            
            // Extract error description
            const errorMatch = resultUrl.match(/error_description=([^&]+)/);
            const errorDesc = errorMatch ? decodeURIComponent(errorMatch[1].replace(/\+/g, ' ')) : 'Unknown error';
            
            console.log('Error description:', errorDesc);
            
            // If it's a database error saving new user, we can still proceed
            if (errorDesc.includes('Database error saving new user')) {
              console.log('Database error detected, but proceeding to PostLoginScreen anyway');
              
              // Let App-enhanced.tsx handle navigation based on session state
              console.log('Database error detected, but session should still trigger navigation in App-enhanced.');
              return;
            } else {
              // For other errors, show an alert
              setErrorMessage(errorDesc);
              Alert.alert('Login Error', errorDesc);
              return;
            }
          }
          
          // Check if we have a session after the OAuth flow
          const { data } = await supabase.auth.getSession();
          
          if (data?.session) {
            console.log('Session found after OAuth flow, navigating to PostLoginScreen');
            
            // Let App-enhanced.tsx handle navigation based on session state
            console.log('Session found after OAuth flow. App-enhanced will handle navigation.');
          } else {
            console.log('No session found after OAuth flow, manually checking for session');
            
            // Try to get the session again after a short delay
            setTimeout(async () => {
              const { data: delayedData } = await supabase.auth.getSession();
              
              if (delayedData?.session) {
                console.log('Session found after delay, navigating to PostLoginScreen');
                
                // Let App-enhanced.tsx handle navigation based on session state
                console.log('Session found after delay. App-enhanced will handle navigation.');
              } else {
                console.error('No session found after OAuth flow and delay');
                
              // No session found after delay, but we can try to extract tokens from the URL
              console.log('No session found after OAuth flow and delay. Attempting to extract tokens from URL...');
              
              try {
                // Try to extract tokens from the URL
                const resultUrl = result.url || '';
                
                // Try to extract from fragment first (after #)
                let fragment = resultUrl.split('#')[1];
                let params = fragment ? new URLSearchParams(fragment) : null;
                
                // If no tokens in fragment, try query params (after ?)
                if (!params || !params.get('access_token')) {
                  const query = resultUrl.split('?')[1];
                  params = query ? new URLSearchParams(query) : null;
                }
                
                // Check if we found any params
                if (params) {
                  console.log('Found URL parameters, attempting to extract tokens');
                  const access_token = params.get('access_token');
                  const refresh_token = params.get('refresh_token');
                  
                  if (access_token) {
                    console.log('Access token found in URL. Setting session manually...');
                    
                    // Manually set the session with the extracted tokens
                    const sessionData = { 
                      access_token,
                      refresh_token: refresh_token || '' // Use empty string if no refresh token
                    };
                    
                    // Store the token in AsyncStorage as well for redundancy
                    await storeAuthData(sessionData);
                    
                    // Set the session in Supabase
                    const { data, error } = await supabase.auth.setSession(sessionData);
                    
                    if (error) {
                      console.error('Error setting session manually:', error);
                      setErrorMessage('Login failed. Could not set session: ' + error.message);
                      Alert.alert('Login Error', 'Could not set session: ' + error.message);
                    } else if (data?.session) {
                      console.log('Session set successfully from URL tokens');
                      // App-enhanced will handle navigation based on session state
                    } else {
                      console.error('No session returned after manual setSession');
                      
                      // Try one more approach - sign in with the token directly
                      try {
                        console.log('Attempting to sign in with token directly...');
                        const { data: signInData, error: signInError } = await supabase.auth.signInWithIdToken({
                          provider: 'google',
                          token: access_token
                        });
                        
                        if (signInError) {
                          console.error('Error signing in with token:', signInError);
                          setErrorMessage('Login failed. Could not sign in with token.');
                          Alert.alert('Login Error', 'Login failed. Could not sign in with token.');
                        } else if (signInData?.session) {
                          console.log('Successfully signed in with token');
                          // App-enhanced will handle navigation based on session state
                        }
                      } catch (signInError) {
                        console.error('Exception during token sign-in:', signInError);
                        setErrorMessage('Login failed. Could not verify session.');
                        Alert.alert('Login Error', 'Login failed. Could not verify session.');
                      }
                    }
                    return;
                  }
                }
                
                // If we get here, we couldn't extract tokens
                console.error('No tokens found in URL after OAuth flow');
                setErrorMessage('Login failed. Could not verify session.');
                Alert.alert('Login Error', 'Login failed. Could not verify session.');
              } catch (tokenError) {
                console.error('Error processing OAuth tokens:', tokenError);
                setErrorMessage('Login failed. Error processing authentication response.');
                Alert.alert('Login Error', 'Error processing authentication response.');
              }
              }
            }, 1000);
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log('OAuth flow was cancelled by the user:', result.type);
          // User cancelled the authentication, just show a message
          setErrorMessage('Authentication was cancelled.');
          // No need for an alert as this is a user-initiated cancellation
        } else {
          console.log('OAuth flow browser session ended with error:', result.type);
          // Handle potential browser errors
          setErrorMessage('Authentication browser session failed.');
          Alert.alert('Authentication Error', 'The authentication process was interrupted or failed.');
        }
      } else {
        console.error('No URL returned from signInWithOAuth');
        setErrorMessage('Failed to initiate Google login.');
        Alert.alert('Login Error', 'Failed to initiate Google login. Please try again.');
      }
    } catch (error) {
      console.error('Google login error (standard client):', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred during Google login';
      setErrorMessage(errorMsg);
      Alert.alert('Login Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // Implement Apple login logic here
      Alert.alert('Apple Login', 'Apple login logic goes here.');
    } catch (error) {
      console.error('Apple login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Removed conditional rendering based on initializing state

  return (
    <GradientBackground variant={selectedFeature}>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.05} variant={selectedFeature} />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={tw`absolute top-12 left-6 z-10 p-2 rounded-full bg-white/80`}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <ArrowLeft size={24} color="#4A3B78" weight="bold" />
        </TouchableOpacity>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1 justify-center`}
        >
          <View style={tw`flex-1 p-6 justify-center`}>
            <View style={tw`bg-white/90 rounded-xl p-6 shadow-lg border border-soothing-blue`}>
              <Typography variant="subtitle" style={tw`mb-6 text-center text-jung-purple`}>
                Welcome Back
              </Typography>
              
              {/* Error Message */}
              {errorMessage ? (
                <View style={tw`mb-4 p-3 bg-red-100 rounded-lg`}>
                  <Text style={tw`text-red-700 text-sm`}>{errorMessage}</Text>
                </View>
              ) : null}
              
              {/* Feature Selection Buttons */}
              <View style={tw`flex-row justify-center mb-6`}>
                <TouchableOpacity 
                  style={tw`mx-2 items-center ${selectedFeature === 'conversation' ? 'opacity-100' : 'opacity-60'}`}
                  onPress={() => setSelectedFeature('conversation')}
                >
                  <View style={tw`w-12 h-12 rounded-full bg-conversation mb-1 items-center justify-center`}>
                    <Envelope size={22} color="#fff" weight="fill" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`mx-2 items-center ${selectedFeature === 'motivation' ? 'opacity-100' : 'opacity-60'}`}
                  onPress={() => setSelectedFeature('motivation')}
                >
                  <View style={tw`w-12 h-12 rounded-full bg-motivation mb-1 items-center justify-center`}>
                    <ArrowLeft size={22} color="#fff" weight="fill" style={{transform: [{rotate: '45deg'}]}} />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Motivation</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`mx-2 items-center ${selectedFeature === 'emotional' ? 'opacity-100' : 'opacity-60'}`}
                  onPress={() => setSelectedFeature('emotional')}
                >
                  <View style={tw`w-12 h-12 rounded-full bg-emotional mb-1 items-center justify-center`}>
                    <Lock size={22} color="#fff" weight="fill" />
                  </View>
                  <Text style={tw`text-xs text-gray-600`}>Emotional</Text>
                </TouchableOpacity>
              </View>
              
              {showEmailLogin ? (
                <>
                  {/* Email/Password Login Fields */}
                  <View style={tw`mb-4`}>
                    <View style={tw`flex-row items-center mb-2`}>
                      <Envelope size={20} color="#6A8EAE" weight="duotone" />
                      <Text style={tw`ml-2 text-gray-600`}>Email</Text>
                    </View>
                    <TextInput
                      style={tw`border rounded-lg p-3 bg-soothing-blue/10 border-soothing-blue`}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#A0AEC0"
                      editable={!loading}
                    />
                  </View>
                  
                  <View style={tw`mb-4`}>
                    <View style={tw`flex-row items-center mb-2`}>
                      <Lock size={20} color="#6A8EAE" weight="duotone" />
                      <Text style={tw`ml-2 text-gray-600`}>Password</Text>
                    </View>
                    <TextInput
                      style={tw`border rounded-lg p-3 bg-soothing-blue/10 border-soothing-blue`}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholderTextColor="#A0AEC0"
                      editable={!loading}
                    />
                  </View>
                  
                  {/* Login Button */}
                  <TouchableOpacity
                    style={tw`rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-md ${loading ? 'bg-jung-purple/70' : 'bg-jung-purple'}`}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={tw`text-white font-bold text-lg`}>Login</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={tw`mt-2 mb-4`}
                    onPress={() => setShowEmailLogin(false)}
                    disabled={loading}
                  >
                    <Text style={tw`text-center text-soothing-blue`}>
                      ← Back to login options
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Email Login Button */}
                  <SocialButton
                    provider="email"
                    onPress={() => setShowEmailLogin(true)}
                    variant={selectedFeature}
                    disabled={loading}
                  />
                  
                  {/* Google Login Button */}
                  <SocialButton
                    provider="google"
                    onPress={handleGoogleLogin}
                    loading={loading}
                    disabled={loading}
                    variant={selectedFeature}
                  />

                  {/* Apple Login Button */}
                  <SocialButton
                    provider="apple"
                    onPress={handleAppleLogin}
                    variant={selectedFeature}
                    disabled={loading}
                  />
                </>
              )}
              
              {/* Register Link */}
              <TouchableOpacity 
                style={tw`mt-4`}
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={tw`text-center font-medium text-soothing-blue`}>
                  Don't have an account? Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default LoginScreenEnhanced;
