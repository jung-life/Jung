import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import { ArrowLeft, Lock, Envelope } from 'phosphor-react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define the color scheme
const colors = {
  light: '#A8DADC',
  medium: '#457B9D',
  dark: '#1D3557',
  darkest: '#2C3E50'
};

// Replace the placeholder Google Client ID with the actual value from env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_PROJECT_REF = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] : '';

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        // Navigate to post-login screen
        navigation.navigate('PostLoginScreen');
      }
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
      
      // Get the redirect URL for your app
      const redirectUrl = Linking.createURL('auth/callback');
      console.log('Using redirect URL:', redirectUrl);
      
      // Use Supabase's built-in OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Important to prevent automatic redirect
        }
      });
      
      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('Login Error', error.message);
        return;
      }
      
      if (data?.url) {
        console.log('Opening auth URL:', data.url);
        
        // Open the URL in a browser with more options
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            dismissButtonStyle: 'close',
          }
        );
        
        console.log('Auth session result:', result.type);
        
        if (result.type === 'success') {
          console.log('Auth session completed successfully with URL:', result.url);
          
          // Manually process the URL if needed
          if (result.url) {
            // The AuthUrlHandler will handle this automatically,
            // but we can also process it here if needed
            console.log('Got result URL:', result.url);
            
            // Refresh the session
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error('Error getting session after auth:', error);
            } else if (data.session) {
              console.log('Session retrieved successfully');
              // Navigate if needed
              // navigation.navigate('PostLoginScreen');
            }
          }
        } else {
          console.log('Auth was dismissed or failed');
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'An unexpected error occurred during Google login.');
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
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.05} />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={tw`absolute top-12 left-6 z-10 p-2 rounded-full bg-white/80`}
          onPress={() => {
            navigation.goBack();
            // Alternative approach if goBack() doesn't work:
            // navigation.reset({
            //   index: 0,
            //   routes: [{ name: 'Landing' }],
            // });
          }}
        >
          <ArrowLeft size={24} color={colors.dark} weight="bold" />
        </TouchableOpacity>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1 justify-center`}
        >
          <View style={tw`flex-1 p-6 justify-center`}>
            <View style={[tw`bg-white/95 rounded-xl p-6 shadow-lg`, { borderColor: colors.light, borderWidth: 1 }]}>
              <Typography variant="subtitle" style={[tw`mb-6 text-center`, { color: colors.dark }]}>
                Welcome Back
              </Typography>
              
              {showEmailLogin ? (
                <>
                  {/* Email/Password Login Fields */}
                  <View style={tw`mb-4`}>
                    <View style={tw`flex-row items-center mb-2`}>
                      <Envelope size={20} color={colors.medium} weight="duotone" />
                      <Text style={[tw`ml-2`, { color: colors.medium }]}>Email</Text>
                    </View>
                    <TextInput
                      style={[tw`border rounded-lg p-3`, { 
                        backgroundColor: '#F0F8FF', 
                        borderColor: colors.light 
                      }]}
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
                      <Lock size={20} color={colors.medium} weight="duotone" />
                      <Text style={[tw`ml-2`, { color: colors.medium }]}>Password</Text>
                    </View>
                    <TextInput
                      style={[tw`border rounded-lg p-3`, { 
                        backgroundColor: '#F0F8FF', 
                        borderColor: colors.light 
                      }]}
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  
                  {/* Login Button */}
                  <TouchableOpacity
                    style={[tw`rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-md`, { 
                      backgroundColor: colors.dark 
                    }]}
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
                    <Text style={[tw`text-center`, { color: colors.medium }]}>
                      ← Back to login options
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Email Login Button */}
                  <TouchableOpacity
                    style={[tw`rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-md`, { 
                      backgroundColor: colors.dark 
                    }]}
                    onPress={() => setShowEmailLogin(true)}
                  >
                    <Envelope size={24} color="white" weight="fill" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold text-lg`}>Login with Email</Text>
                  </TouchableOpacity>
                  
                  {/* Google Login Button */}
                  <TouchableOpacity
                    style={[tw`bg-white border rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-sm`, {
                      borderColor: colors.light
                    }]}
                    onPress={handleGoogleLogin}
                  >
                    <AntDesign name="google" size={24} color="#DB4437" style={tw`mr-2`} />
                    <Text style={[tw`font-bold text-lg`, { color: colors.darkest }]}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Apple Login Button */}
                  <TouchableOpacity
                    style={tw`bg-black rounded-lg py-4 flex-row items-center justify-center mb-4 shadow-md`}
                    onPress={handleAppleLogin}
                  >
                    <FontAwesome name="apple" size={24} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-bold text-lg`}>Continue with Apple</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {/* Register Link */}
              <TouchableOpacity 
                style={tw`mt-4`}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={[tw`text-center font-medium`, { color: colors.medium }]}>
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