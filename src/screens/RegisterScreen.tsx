import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import tw from '../lib/tailwind';
import { ArrowLeft, UserPlus, Check, Lock, Envelope, User } from 'phosphor-react-native';
import { GradientBackground } from '../components/GradientBackground';
import { SymbolicBackground } from '../components/SymbolicBackground';
import { Typography } from '../components/Typography';
import TouchableJung from '../components/TouchableJung';
import { ensureUserPreferences } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleBackToLanding = () => {
    navigation.navigate('Landing');
  };

  const handleRegister = async () => {
    // Reset messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate inputs
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter a password.');
      return;
    }

    // Enhanced password policy
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      setErrorMessage(
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMessage('Please confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Register the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: 'yourapp://confirm-email',
        },
      });
      
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      
      // If registration is successful and user is created
      if (data?.user) {
        // Try to create user preferences immediately
        // Note: This might not work if the user isn't fully authenticated yet
        try {
          // Store the user ID for later use
          await AsyncStorage.setItem('pendingUserId', data.user.id);
          
          // Try to ensure user preferences exist
          await ensureUserPreferences();
        } catch (prefError) {
          console.error('Error creating initial user preferences:', prefError);
          // Continue anyway, we'll try again on login
        }
        
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          setErrorMessage('This email is already registered');
        } else if (data.user.confirmed_at) {
          // User is already confirmed (rare case)
          setSuccessMessage('Registration successful! You can now log in.');
          setTimeout(() => navigation.navigate('Landing'), 2000);
        } else {
          // Email confirmation required
          setSuccessMessage(
            'Registration successful! Please check your email to confirm your account.'
          );
        }
      }
    } catch (error: any) {
      console.error('Unexpected error during registration:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.03} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={tw`flex-1`}
        >
          <ScrollView contentContainerStyle={tw`flex-grow`}>
            <View style={tw`flex-row items-center px-5 py-4 border-b border-gray-200/50`}>
              <TouchableJung
                onPress={() => navigation.goBack()}
                style={tw`w-12 h-12 rounded-full bg-transparent flex items-center justify-center border-2 border-jung-gold`}
              >
                <ArrowLeft size={24} color="#D4AF37" weight="light" />
              </TouchableJung>
              
              <Typography variant="title" style={tw`ml-4`}>Create Account</Typography>
            </View>
            
            <View style={tw`flex-1 p-6 justify-center`}>
              <View style={tw`bg-white/90 rounded-xl p-6 shadow-md`}>
                <Typography variant="subtitle" style={tw`mb-6 text-center text-jung-purple`}>
                  Join the Journey of Self-Discovery
                </Typography>
                
                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Envelope size={20} color="#8A2BE2" weight="duotone" />
                    <Text style={tw`ml-2 text-gray-600`}>Email</Text>
                  </View>
                  <TextInput
                    style={tw`border border-gray-300 rounded-lg p-3 bg-white`}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Lock size={20} color="#8A2BE2" weight="duotone" />
                    <Text style={tw`ml-2 text-gray-600`}>Password</Text>
                  </View>
                  <TextInput
                    style={tw`border border-gray-300 rounded-lg p-3 bg-white`}
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
                
                <View style={tw`mb-6`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Check size={20} color="#8A2BE2" weight="duotone" />
                    <Text style={tw`ml-2 text-gray-600`}>Confirm Password</Text>
                  </View>
                  <TextInput
                    style={tw`border border-gray-300 rounded-lg p-3 bg-white`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                
                <TouchableOpacity
                  style={tw`bg-jung-purple rounded-lg py-4 flex-row items-center justify-center ${loading ? 'opacity-70' : ''}`}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <UserPlus size={24} color="white" weight="fill" style={tw`mr-2`} />
                      <Text style={tw`text-white font-bold text-lg`}>Register</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={tw`mt-4`}
                  onPress={() => navigation.navigate('Landing')}
                >
                  <Text style={tw`text-jung-purple text-center`}>
                    Already have an account? Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
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
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#4a5568',
    fontSize: 14,
  },
  loginLink: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
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
  successContainer: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    color: '#15803d',
    fontSize: 14,
  },
}); 