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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedText } from '../components/AnimatedText';
import { quotes } from '../data/quotes';
import { RootStackParamList } from '../navigation/types';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ensureUserPreferences } from '../lib/supabase';
import tw from '../lib/tailwind';
import { Compass, Sparkle, Spiral, MoonStars, Lighthouse, MapTrifold } from 'phosphor-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

export const LandingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteComplete, setIsQuoteComplete] = useState(false);
  const { signIn } = useAuth();
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleQuoteComplete = () => {
    setIsQuoteComplete(true);
  };

  const handleNextQuote = () => {
    setIsQuoteComplete(false);
    setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Attempting login with:', email);
      
      // Add detailed logging
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email Not Verified', 'Please check your email and click the confirmation link before logging in.');
        } else {
          Alert.alert('Login Error', error.message);
        }
        return;
      }
      
      if (data?.user) {
        console.log('Login successful:', data.user.id);
        
        // Ensure user preferences exist
        await ensureUserPreferences();
        
        // Check if session was created properly
        const session = await supabase.auth.getSession();
        console.log('Session after login:', session.data.session ? 'Valid' : 'Missing');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
      });
      
      if (error) {
        console.error('Password reset error:', error);
        Alert.alert('Error', error.message);
        return;
      }
      
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.'
      );
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>Jung</Text>
        <Text style={styles.subtitle}>AI-Guided Self-Discovery</Text>
        
        {!showLoginForm ? (
          <>
            <Text style={styles.description}>
              Where AI meets analytical psychology.{'\n'}
              Explore your inner world, understand your{'\n'}
              unconscious, and grow through reflection.
            </Text>
            
            <View style={styles.quoteContainer}>
              <AnimatedText
                text={quotes[currentQuoteIndex].text}
                onComplete={handleQuoteComplete}
                style={styles.quote}
              />
              <Text style={styles.author}>— {quotes[currentQuoteIndex].author}</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.nextButton,
                  !isQuoteComplete && styles.disabledButton,
                ]}
                onPress={handleNextQuote}
                disabled={!isQuoteComplete}
              >
                <Text style={styles.buttonText}>Next Quote</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={() => setShowLoginForm(true)}
              >
                <View style={tw`flex-row items-center justify-center`}>
                  <Spiral size={24} color="white" weight="duotone" style={tw`mr-2`} />
                  <Text style={styles.buttonText}>Begin My Journey</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.loginButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={tw`flex-row items-center justify-center`}>
                  <Lighthouse size={24} color="white" weight="duotone" style={tw`mr-2`} />
                  <Text style={styles.buttonText}>Continue Journey</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => setShowLoginForm(false)}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>← Back to home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`mt-2`}
              onPress={handleForgotPassword}
            >
              <Text style={tw`text-jung-purple text-center`}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4a5568',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  quoteContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 40,
    width: '100%',
    maxWidth: 500,
  },
  quote: {
    fontSize: 20,
    lineHeight: 28,
    color: '#2c3e50',
    marginBottom: 15,
  },
  author: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 500,
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4a5568',
  },
  loginButton: {
    backgroundColor: '#0284c7',
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#0284c7',
    fontSize: 14,
  },
}); 