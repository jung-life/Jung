import React, { useState, useEffect } from 'react';
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
import Constants from 'expo-constants';
import { useSupabase } from '../contexts/SupabaseContext';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Define the color scheme
const colors = {
  light: '#A8DADC',
  medium: '#457B9D',
  dark: '#1D3557',
  darkest: '#2C3E50'
};

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  
  // Use the Supabase context
  const { login } = useSupabase();

  // Get Google Client ID from environment variables
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                        '';
  
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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({ useProxy: true }),
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        Alert.alert('Login Error', error.message);
        return;
      }

      if (data?.url) {
        console.log('Opening auth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          AuthSession.makeRedirectUri({ useProxy: true })
        );

        console.log('WebBrowser result:', result);

        if (result.type === 'success') {
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1]);
          
          if (params.has('access_token')) {
            const session = {
              access_token: params.get('access_token')!,
              refresh_token: params.get('refresh_token') || '',
            };

            const { error } = await supabase.auth.setSession(session);
            
            if (error) throw error;

            navigation.navigate('Home');
          }
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', error.message);
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
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#DB4437" style={tw`mr-2`} />
                    ) : (
                      <AntDesign name="google" size={24} color="#DB4437" style={tw`mr-2`} />
                    )}
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