import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image
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
import { GradientText } from '../components/GradientText';
import { AnimatedTitle } from '../components/AnimatedTitle';
import { Easing } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

const AnimatedJungTitle = () => {
  const fadeAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  const moveAnim = useRef([
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20)
  ]).current;
  
  useEffect(() => {
    const animations = fadeAnim.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: 300 * index,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        }),
        Animated.timing(moveAnim[index], {
          toValue: 0,
          duration: 600,
          delay: 300 * index,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5))
        })
      ]);
    });
    
    Animated.stagger(100, animations.flat()).start();
  }, []);
  
  const letters = ['J', 'U', 'N', 'G'];
  const colors = ['#A8DADC', '#457B9D', '#1D3557', '#2C3E50'];
  
  return (
    <View style={tw`flex-row mb-2`}>
      {letters.map((letter, index) => (
        <Animated.Text
          key={index}
          style={[
            tw`text-6xl font-extrabold tracking-wider`,
            { 
              color: colors[index],
              opacity: fadeAnim[index],
              transform: [{ translateY: moveAnim[index] }]
            }
          ]}
        >
          {letter}
        </Animated.Text>
      ))}
    </View>
  );
};

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
      
      // Call the signIn function from AuthContext
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
      
      // Navigation will be handled by App.tsx based on isNewUser state
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

  const handleBeginJourney = () => {
    // Navigate to the Login screen
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <View style={styles.content}>
        <View style={tw`items-center mb-8 mt-12`}>
          <AnimatedJungTitle />
          
          <Image
            source={require('../../assets/shiva-sakthi-logo.webp')}
            style={tw`w-48 h-48 mt-4`}
            resizeMode="contain"
          />
          
          <View style={tw`flex-row justify-center flex-wrap px-6 mb-2`}>
            <Text style={tw`text-base italic font-medium`}>
              <Text style={{ color: '#1A1A1A', fontWeight: 'bold' }}>J</Text>
              <Text style={tw`text-gray-800`}>ourney into </Text>
              <Text style={{ color: '#0047AB', fontWeight: 'bold' }}>U</Text>
              <Text style={tw`text-gray-800`}>nveiling </Text>
              <Text style={{ color: '#8B0000', fontWeight: 'bold' }}>N</Text>
              <Text style={tw`text-gray-800`}>ew </Text>
              <Text style={{ color: '#2E8B57', fontWeight: 'bold' }}>G</Text>
              <Text style={tw`text-gray-800`}>rowth</Text>
            </Text>
          </View>
        </View>
        
        {!showLoginForm ? (
          <>
            <Text style={styles.description}>
              Where AI meets analytical psychology.{'\n'}
              Explore your inner world, understand your{'\n'}
              unconscious, and grow through reflection.
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={handleBeginJourney}
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

export default LandingScreen; 