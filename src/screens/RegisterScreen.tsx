import React, { useState, useEffect } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RegisterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasConsented, setHasConsented] = useState(false);

  const handleBackToLanding = () => {
    navigation.navigate('Landing');
  };

  const saveUserProfile = async (userId: string, userData: { email: string, fullName?: string }) => {
    try {
      const profileData = {
        user_id: userId,
        email: userData.email,
        full_name: userData.fullName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);
        
      if (error) {
        console.error('Error saving user profile:', error);
        Alert.alert('Profile Creation Failed', 'An error occurred while saving your profile.');
        return false;
      }
      
      console.log('User profile saved successfully');
      return true;
    } catch (error: any) {
      console.error('Unexpected error saving user profile:', error);
      Alert.alert('Profile Creation Failed', 'An unexpected error occurred.');
      return false;
    }
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Password validation function
  const isValidPassword = (password: string) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  };

  const handleRegister = async () => {
    if (!hasConsented) {
      Alert.alert('Consent Required', 'You must consent to the Privacy Policy and Terms of Service to create an account.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long and include uppercase, lowercase, numeric, and special characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: 'yourapp://confirm-email',
          data: {
            full_name: fullName
          }
        }
      });

      if (response.error) {
        Alert.alert('Registration Failed', response.error.message);
        setLoading(false);
        return;
      }

      if (response.data.user) {
        const profileSaved = await saveUserProfile(response.data.user.id, { 
          email, 
          fullName: fullName 
        });
        
        if (!profileSaved) {
          return;
        }
        
        if (response.data.user.confirmed_at) {
          setSuccessMessage('Registration successful! You can now log in.');
          // Log in the user after successful registration
          const { error: signInError } = await supabase.auth.signIn({
            email: email,
            password: password,
          });

          if (signInError) {
            Alert.alert('Login Failed', 'An error occurred while logging in. Please try again.');
            setLoading(false);
            return;
          }

          // Navigate to the ReflectionsPage
          setTimeout(() => navigation.navigate('ReflectionsPage'), 2000);
        } else {
          setSuccessMessage(
            'Registration successful! Please check your email to confirm your account.'
          );
        }
      }
    } catch (error: any) {
      console.error('Unexpected error during registration:', error);
      Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again.');
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
                    <Text style={tw`ml-2 text-gray-600`}>Full Name</Text>
                  </View>
                  <TextInput
                    style={tw`border border-gray-300 rounded-lg p-3 bg-white`}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
                
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
                
                <View style={tw`flex-row items-start mb-4`}>
                  <TouchableOpacity 
                    style={tw`mt-1 mr-2`} 
                    onPress={() => setHasConsented(!hasConsented)}
                  >
                    <View style={[
                      tw`w-5 h-5 border border-gray-400 rounded`,
                      hasConsented && tw`bg-blue-500 border-blue-500`
                    ]}>
                      {hasConsented && <Check size={16} color="white" weight="bold" />}
                    </View>
                  </TouchableOpacity>
                  <Text style={tw`text-sm text-gray-700 flex-1`}>
                    I consent to the <Text 
                      style={tw`text-blue-500 underline`}
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                      Privacy Policy
                    </Text> and <Text 
                      style={tw`text-blue-500 underline`}
                      onPress={() => navigation.navigate('TermsOfService')}
                    >
                      Terms of Service
                    </Text>, including the processing of my personal data.
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={tw`bg-jung-purple rounded-lg py-4 flex-row items-center justify-center ${loading ? 'opacity-70' : ''} shadow-md border border-jung-purple-light`}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <UserPlus size={24} color={tw.color('jung-animus')} weight="fill" style={tw`mr-2`} />
                      <Text style={tw`text-jung-animus font-bold text-lg`}>Join the Adventure!</Text>
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