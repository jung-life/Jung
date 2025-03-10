import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { SocialButton } from '../components/SocialButton';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { AntDesign } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export const AuthScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '478933387478-6vg33n8ph627csrvi6rg929i014ta5mm.apps.googleusercontent.com',
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'jung'
      }),
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      extraParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
    },
    discovery
  );

  useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink({ url });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleEmailVerification = async (token: string, type: string) => {
    try {
      setLoading(true);
      
      if (type === 'signup') {
        // Handle email confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });
        
        if (error) throw error;
        
        Alert.alert(
          'Email Verified',
          'Your email has been verified successfully. You can now sign in.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error verifying email:', error);
      Alert.alert('Verification Failed', error.message || 'Failed to verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = async ({ url }: { url: string }) => {
    if (url) {
      console.log('Deep link URL:', url);
      
      // Handle email verification links
      if (url.includes('type=signup') && url.includes('token=')) {
        const params = new URLSearchParams(url.split('#')[1]);
        const token = params.get('token');
        const type = params.get('type');
        
        if (token && type) {
          await handleEmailVerification(token, type);
        }
      }
      
      // Handle other auth callbacks
      const [, queryString] = url.split('#');
      if (queryString) {
        const params = new URLSearchParams(queryString);
        await supabase.auth.getUser();
      }
    }
  };

  const handleEmailLogin = async () => {
    // Validate email and password
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Missing Information', 'Please enter your password.');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Session will be automatically stored by Supabase
      console.log('Login successful:', data.session);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error logging in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      // Method 1: Using Supabase's built-in OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Linking.createURL('auth/callback'),
        }
      });
  
      if (error) throw error;
      
      if (data?.url) {
        // Open the URL in a browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          Linking.createURL('auth/callback')
        );
        
        if (result.type === 'success') {
          // The user was redirected back to your app
          const { url } = result;
          // Extract tokens from URL
          const params = new URLSearchParams(url.split('#')[1]);
          // Refresh session
          await supabase.auth.getSession();
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'jung://auth/callback',
          queryParams: {
            scope: 'email name',
          },
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        await WebBrowser.openBrowserAsync(data.url);
      }
    } catch (error: any) {
      console.error('Error signing in with Apple:', error.message);
      alert('Error signing in with Apple');
    }
  };

  const handleBackToLanding = () => {
    navigation.navigate('Landing');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToLanding}>
          <AntDesign name="arrowleft" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Continue your journey of self-discovery</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.button, styles.emailButton]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <SocialButton
              onPress={handleGoogleLogin}
              iconName="google"
              text={googleLoading ? "Connecting..." : "Google"}
              disabled={googleLoading}
            />
            <SocialButton
              onPress={handleAppleLogin}
              iconName="apple1"
              text="Apple"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  emailButton: {
    backgroundColor: '#0284c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerText: {
    color: '#4a5568',
    fontSize: 14,
  },
  registerLink: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#718096',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    width: '100%',
    marginTop: 8,
  },
}); 