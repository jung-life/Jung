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
import { supabase, storeAuthData, checkSession } from '../lib/supabase';
import tw from '../lib/tailwind';
import { ArrowLeft, Lock, Envelope } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import { SocialButton } from '../components/SocialButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Constants from 'expo-constants';
import { useSupabase } from '../contexts/SupabaseContext';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'default' | 'conversation' | 'motivation' | 'emotional'>('default');
  
  // Use the Supabase context
  const { login } = useSupabase();

  // Get Google Client ID from environment variables
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                         '';
  
  // Removed redundant onAuthStateChange listener. 
  // Navigation is now handled by AppNavigator based on AuthContext state.

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting email login...');
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      console.log('Starting Google login flow...');
      
      const redirectUri = AuthSession.makeRedirectUri({});
      console.log('Using Redirect URI:', redirectUri); // Log the redirect URI

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('Login Error', error.message);
        setLoading(false);
        return;
      }

      if (data?.url) {
        console.log('Opening auth URL:', data.url);
        
        // Open the URL in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        console.log('WebBrowser result:', JSON.stringify(result));

        if (result.type === 'success') {
          console.log('OAuth flow successful, URL:', result.url);
          
          // Extract token from URL if available
          const url = result.url;
          if (url.includes('#') || url.includes('?')) {
            console.log('URL contains parameters, will be processed by App.tsx handler');
            
            // Force a small delay to ensure the App.tsx handler has time to process
            setTimeout(() => {
              if (!navigation.isFocused()) {
                console.log('Login screen is no longer focused, navigation likely occurred');
              } else {
                console.log('Login screen is still focused, manually navigating...');
                navigation.reset({ index: 0, routes: [{ name: 'PostLoginScreen' }] });
              }
            }, 1000);
          }
        } else {
          console.log('OAuth flow browser session ended:', result.type);
          if (result.type !== 'cancel' && result.type !== 'dismiss') {
            // Handle potential browser errors
            Alert.alert('Authentication Error', 'The authentication process was interrupted or failed.');
          }
        }
      } else {
        console.error('No URL returned from signInWithOAuth');
        Alert.alert('Login Error', 'Failed to initiate Google login. Please try again.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      // Implement Apple login logic here
      Alert.alert('Apple Login', 'Apple login logic goes here.');
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('Error', 'An error occurred during Apple login.');
    }
  };

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
                    />
                  </View>
                  
                  {/* Login Button */}
                  <TouchableOpacity
                    style={tw`rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-md bg-jung-purple`}
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
                  />
                </>
              )}
              
              {/* Register Link */}
              <TouchableOpacity 
                style={tw`mt-4`}
                onPress={() => navigation.navigate('Register')}
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

export default LoginScreen;
