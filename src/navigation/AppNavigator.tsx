// In AppNavigator.tsx
import React from 'react';
import { AccountScreen } from '../screens/AccountScreen';
import LandingScreen from '../screens/LandingScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DisclaimerScreen } from '../screens/DisclaimerScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth'; // Ensure this path is correct
import { RootStackParamList } from './types';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import PostLoginScreen from '../screens/PostLoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';
import { EmotionalAssessmentScreen } from '../screens/EmotionalAssessmentScreen';
import SelfHelpResourcesScreen from '../screens/SelfHelpResourcesScreen';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { navigationRef } from './navigationService';
import { LoadingScreen } from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Default header options with hamburger menu
const defaultPostLoginOptions = {
  headerRight: () => <HamburgerMenu />,
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#4A3B78',
  headerTitleStyle: {
    fontWeight: 'bold' as const,
  },
};

// Define Auth Stack
const AuthStack = () => (
  <Stack.Navigator
    initialRouteName="LandingScreen"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="LandingScreen" component={LandingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Define Main App Stack
const MainAppStack = ({ isNewUser }: { isNewUser: boolean }) => (
  <Stack.Navigator
    // Set initial route based on whether user needs to see disclaimer
    initialRouteName={isNewUser ? "DisclaimerScreen" : "PostLoginScreen"}
    // Apply default screen options, can be overridden per screen
    screenOptions={{ headerShown: false, ...defaultPostLoginOptions }} 
  >
    {/* Screens accessible after login */}
    <Stack.Screen
      name="PostLoginScreen"
      component={PostLoginScreen}
      options={{ headerShown: true, title: 'Home' }} // Override headerShown
    />
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: true, title: 'Home' }}
    />
    <Stack.Screen
      name="ConversationsScreen"
      component={ConversationsScreen}
      options={{ headerShown: true, title: 'Conversations' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: true, title: 'Chat' }}
    />
    <Stack.Screen
      name="AccountScreen"
      component={AccountScreen}
      options={{ headerShown: true, title: 'Account Settings' }}
    />
    <Stack.Screen
      name="PrivacyPolicyScreen"
      component={PrivacyPolicyScreen}
      options={{ headerShown: true, title: 'Privacy Policy' }}
    />
    <Stack.Screen
      name="TermsOfServiceScreen"
      component={TermsOfServiceScreen}
      options={{ headerShown: true, title: 'Terms of Service' }}
    />
    <Stack.Screen
      name="DisclaimerScreen"
      component={DisclaimerScreen}
      options={{ headerShown: true, title: 'Disclaimer' }}
    />
    <Stack.Screen
      name="DailyMotivationScreen"
      component={DailyMotivationScreen}
      options={{ headerShown: true, title: 'Daily Motivation' }}
    />
    <Stack.Screen
      name="EmotionalAssessmentScreen"
      component={EmotionalAssessmentScreen}
      options={{ headerShown: true, title: 'Emotional Assessment' }}
    />
    <Stack.Screen
      name="SelfHelpResourcesScreen"
      component={SelfHelpResourcesScreen}
      options={{ headerShown: true, title: 'Self-Help Resources' }}
    />
  </Stack.Navigator>
);


const AppNavigator = () => {
  const { session, isNewUser, loading } = useAuth();
  const user = session?.user;

  // Show loading screen while checking auth state
  if (loading) {
    // Render LoadingScreen directly, NavigationContainer will wrap the chosen stack
    return <LoadingScreen />;
  }

  return (
    // NavigationContainer wraps the conditionally rendered stack
    <NavigationContainer ref={navigationRef}>
      {user ? <MainAppStack isNewUser={isNewUser} /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
