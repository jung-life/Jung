import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated
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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { initializeGoogleSignIn, signInWithGoogle } from '../lib/googleSignIn';

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'default' | 'conversation' | 'motivation' | 'emotional'>('default');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Individual animation refs for each button
  const connectPulseAnim = useRef(new Animated.Value(1)).current;
  const growFloatAnim = useRef(new Animated.Value(0)).current;
  const healGlowAnim = useRef(new Animated.Value(0)).current;
  
  // Rotation animation for icons
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  
  // Use the Supabase context
  const { login } = useSupabase();

  // Get Google Client ID from environment variables
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
                        Constants.expoConfig?.extra?.googleClientId ||
                         '';
  
  // Initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous animations for buttons
    startContinuousAnimations();
  }, []);

  // Continuous animations for the feature buttons
  const startContinuousAnimations = () => {
    // Connect button pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(connectPulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(connectPulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Grow button floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(growFloatAnim, {
          toValue: -5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(growFloatAnim, {
          toValue: 5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(growFloatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Heal button glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(healGlowAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(healGlowAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon rotation animation
    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  };

  // Feature selection with smooth transition
  const handleFeatureSelection = (feature: 'default' | 'conversation' | 'motivation' | 'emotional') => {
    // Button animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedFeature(feature);
  };

  // Get motivational messages based on selected feature
  const getMotivationalMessage = () => {
    switch(selectedFeature) {
      case 'conversation':
        return "Ready to explore your inner dialogue?";
      case 'motivation':
        return "Unlock your potential within";
      case 'emotional':
        return "Embrace your emotional journey";
      default:
        return "Your journey to self-discovery awaits";
    }
  };

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
      console.log('🔵 Starting native Google Sign-In...');
      
      // Use the native Google Sign-In
      const result = await signInWithGoogle();
      
      if (result.data?.session) {
        await storeAuthData(result.data.session);
        console.log('🔵 Google login completed successfully');
        
        // Let AuthContext handle navigation
        console.log('🔵 Login successful - AuthContext will handle navigation');
      }
    } catch (error) {
      console.error('🔵 Google login error:', error);
      if (error instanceof Error) {
        if (error.message === 'Sign-in was cancelled') {
          console.log('🔵 User cancelled Google Sign-In');
          return;
        }
        Alert.alert('Google Sign-In Error', error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred during Google Sign-In');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple login flow...');
      console.log('🍎 Bundle ID Check:', Constants.expoConfig?.ios?.bundleIdentifier);

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      console.log('🍎 Apple Sign In available:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert('Apple Sign In Not Available', 
          'Please ensure you are on a real iOS device (not simulator) and signed into iCloud with 2FA enabled.');
        setLoading(false);
        return;
      }

      // Generate a random nonce for security
      const nonce = Math.random().toString(36).substring(2, 10);
      console.log('🍎 Generated nonce:', nonce);
      
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      console.log('🍎 Requesting Apple authentication...');
      
      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      console.log('🍎 Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
        hasIdentityToken: !!credential.identityToken,
        hasAuthorizationCode: !!credential.authorizationCode
      });

      if (credential.identityToken && supabase) {
        console.log('🍎 Authenticating with Supabase...');
        
        // Sign in with Supabase using Apple credentials
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce,
        });

        if (error) {
          console.error('🍎 Supabase Apple auth error:', error);
          Alert.alert('Login Error', `Supabase authentication failed: ${error.message}`);
          return;
        }

        console.log('🍎 Supabase authentication successful:', {
          userId: data?.user?.id,
          hasSession: !!data?.session
        });

        // Store session data if available
        if (data.session) {
          await storeAuthData(data.session);
          console.log('🍎 Apple login completed successfully');
          
          // Don't manually navigate - let AuthContext handle the disclaimer flow
          // The AppNavigator will automatically show DisclaimerScreen for new users
          // or PostLoginScreen for existing users based on isNewUser state
          console.log('🍎 Login successful - AuthContext will handle navigation');
        }
      } else {
        console.error('🍎 No identity token received from Apple');
        Alert.alert('Error', 'Failed to get identity token from Apple. Please try again.');
      }
    } catch (error: any) {
      console.error('🍎 Detailed Apple error:', {
        code: error.code,
        message: error.message,
        domain: error.domain,
        userInfo: error.userInfo,
        stack: error.stack
      });
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('🍎 User cancelled Apple Sign In');
        return;
      }
      
      // Provide specific error messages based on error codes
      let errorMessage = 'An error occurred during Apple login.';
      
      if (error.code === -7026 || error.message?.includes('AKAuthenticationError')) {
        errorMessage = 'Apple Sign In configuration error. Please ensure your app is properly configured in Apple Developer Console with bundle ID: org.name.jung';
      } else if (error.code === 1000) {
        errorMessage = 'Apple Sign In capability not enabled. Please check your Apple Developer Console configuration.';
      } else if (error.message?.includes('authorization attempt failed')) {
        errorMessage = 'Authorization failed. Please ensure you have a valid Apple Developer account and the app is properly configured.';
      }
      
      Alert.alert('Apple Sign In Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground variant={selectedFeature} animate>
      <SafeAreaView style={tw`flex-1`}>
        <SymbolicBackground opacity={0.15} variant={selectedFeature} animate />
        
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
            <Animated.View 
              style={[
                tw`bg-white/90 rounded-xl p-6 shadow-lg border border-soothing-blue`,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Typography variant="subtitle" style={tw`mb-2 text-center text-jung-purple`}>
                Welcome Back
              </Typography>
              
              {/* Motivational Subtitle */}
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={tw`text-sm text-center text-gray-600 mb-6 italic`}>
                  {getMotivationalMessage()}
                </Text>
              </Animated.View>
              
              {/* Feature Selection Buttons with Enhanced Design */}
              <View style={tw`flex-row justify-center mb-6`}>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity 
                    style={tw`mx-2 items-center ${selectedFeature === 'conversation' ? 'opacity-100' : 'opacity-60'}`}
                    onPress={() => handleFeatureSelection('conversation')}
                  >
                    <View style={[
                      tw`w-14 h-14 rounded-full mb-2 items-center justify-center shadow-lg`,
                      { backgroundColor: selectedFeature === 'conversation' ? '#6A8EAE' : '#B0BEC5' }
                    ]}>
                      <Envelope size={24} color="#fff" weight={selectedFeature === 'conversation' ? 'fill' : 'regular'} />
                    </View>
                    <Text style={tw`text-xs font-medium ${selectedFeature === 'conversation' ? 'text-conversation' : 'text-gray-500'}`}>
                      Connect
                    </Text>
                    <Text style={tw`text-xs text-gray-400`}>Deep conversations</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity 
                    style={tw`mx-2 items-center ${selectedFeature === 'motivation' ? 'opacity-100' : 'opacity-60'}`}
                    onPress={() => handleFeatureSelection('motivation')}
                  >
                    <View style={[
                      tw`w-14 h-14 rounded-full mb-2 items-center justify-center shadow-lg`,
                      { backgroundColor: selectedFeature === 'motivation' ? '#97C1A9' : '#B0BEC5' }
                    ]}>
                      <ArrowLeft size={24} color="#fff" weight={selectedFeature === 'motivation' ? 'fill' : 'regular'} style={{transform: [{rotate: '45deg'}]}} />
                    </View>
                    <Text style={tw`text-xs font-medium ${selectedFeature === 'motivation' ? 'text-motivation' : 'text-gray-500'}`}>
                      Grow
                    </Text>
                    <Text style={tw`text-xs text-gray-400`}>Personal growth</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity 
                    style={tw`mx-2 items-center ${selectedFeature === 'emotional' ? 'opacity-100' : 'opacity-60'}`}
                    onPress={() => handleFeatureSelection('emotional')}
                  >
                    <View style={[
                      tw`w-14 h-14 rounded-full mb-2 items-center justify-center shadow-lg`,
                      { backgroundColor: selectedFeature === 'emotional' ? '#CEB5CD' : '#B0BEC5' }
                    ]}>
                      <Lock size={24} color="#fff" weight={selectedFeature === 'emotional' ? 'fill' : 'regular'} />
                    </View>
                    <Text style={tw`text-xs font-medium ${selectedFeature === 'emotional' ? 'text-emotional' : 'text-gray-500'}`}>
                      Heal
                    </Text>
                    <Text style={tw`text-xs text-gray-400`}>Emotional wellness</Text>
                  </TouchableOpacity>
                </Animated.View>
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
              
              {/* Motivational Success Stories */}
              <View style={tw`mt-4 mb-4 px-2`}>
                <Text style={tw`text-xs text-center text-gray-500 mb-2`}>
                  Join thousands finding clarity and transformation
                </Text>
                <View style={tw`flex-row justify-center items-center`}>
                  <View style={tw`flex-row`}>
                    {[1, 2, 3, 4, 5].map((_, index) => (
                      <View 
                        key={index}
                        style={[
                          tw`w-6 h-6 rounded-full border-2 border-white -ml-1 first:ml-0`,
                          {
                            backgroundColor: index === 0 ? '#6A8EAE' : 
                                           index === 1 ? '#97C1A9' : 
                                           index === 2 ? '#CEB5CD' : 
                                           index === 3 ? '#A8DADC' : '#CFC7DC'
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={tw`ml-2 text-xs text-gray-600 font-medium`}>
                    2,847+ active users
                  </Text>
                </View>
              </View>

              {/* Register Link */}
              <TouchableOpacity 
                style={tw`mt-2`}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={tw`text-center font-medium text-soothing-blue`}>
                  Don't have an account? <Text style={tw`underline`}>Start your journey</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default LoginScreen;
