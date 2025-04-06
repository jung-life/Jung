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

// Import the standard Supabase client and functions
import { 
  supabase, // Use the standard client
  // Assuming standard functions exist or map appropriately
  // We might need to check supabase.ts for equivalent functions
  // For now, let's assume direct mapping or handle later
} from '../lib/supabase'; 
// We'll need equivalent functions for signInWithEmail, checkSession if they differ

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

export const LoginScreenEnhanced = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'default' | 'conversation' | 'motivation' | 'emotional'>('default');
  
  // Get Google Client ID from environment variables
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                        '';

  // Effect to check the initial session state ONLY for the loading indicator
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If there's no session initially, we can stop initializing
      // If there IS a session, the listener below will handle navigation and stop initializing
      if (!session && isMounted) {
        setInitializing(false);
      }
    }).catch(error => {
       console.error("Error getting initial session:", error);
       if (isMounted) setInitializing(false); // Stop initializing even on error
    });
    
    return () => { isMounted = false; };
  }, []); // Run only once on mount

  // Effect to listen for auth state changes and handle navigation
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change (standard client):', event, !!session);
      
      // Navigate on SIGNED_IN
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, navigating...');
        navigation.reset({ index: 0, routes: [{ name: 'PostLoginScreen' }] });
      }
      
      // Stop initializing indicator once auth state is determined (signed in or not)
      // This handles the case where the user was already signed in
      setInitializing(false); 
      
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
      
      // Use the standard Supabase client
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({}), 
          // Ensure skipBrowserRedirect is false or omitted for Expo Go/Dev Client
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
        // Open the URL, Supabase client (with detectSessionInUrl: true) 
        // and the onAuthStateChange listener will handle the redirect automatically.
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          AuthSession.makeRedirectUri({}) // The redirect URI used here is just for the browser session
        );

        console.log('WebBrowser result (standard client):', result);

        // No need for manual handling here. 
        // If result.type is 'success', the app will receive the deep link,
        // Supabase detects it, exchanges the code, and onAuthStateChange fires.
        if (result.type !== 'success') {
           console.log('OAuth flow browser session ended:', result.type);
           if (result.type !== 'cancel' && result.type !== 'dismiss') {
             // Handle potential browser errors if needed
             setErrorMessage('Authentication browser session failed.');
           }
        }
        // If successful, the onAuthStateChange listener handles navigation.
      } else {
         console.error('No URL returned from signInWithOAuth');
         setErrorMessage('Failed to initiate Google login.');
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

  // Show loading screen during initialization
  if (initializing) {
    return (
      <GradientBackground>
        <SafeAreaView style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#4A3B78" />
          <Text style={tw`mt-4 text-lg text-jung-purple`}>Initializing...</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

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
