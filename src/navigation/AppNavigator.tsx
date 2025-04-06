// In AppNavigator.tsx
import React from 'react';
import { AccountScreen } from '../screens/AccountScreen';
import LandingScreen from '../screens/LandingScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DisclaimerScreen } from '../screens/DisclaimerScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import PostLoginScreen from '../screens/PostLoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';
import { EmotionalAssessmentScreen } from '../screens/EmotionalAssessmentScreen';
import SelfHelpResourcesScreen from '../screens/SelfHelpResourcesScreen'; // Import the new screen
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { navigationRef } from './navigationService';

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

const AppNavigator = () => {
  const { session, isNewUser } = useAuth();
  const user = session?.user;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="LandingScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="LandingScreen" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="PostLoginScreen" 
          component={PostLoginScreen}
          options={{
            headerShown: true,
            title: 'Home',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            headerShown: true,
            title: 'Home',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="ConversationsScreen" 
          component={ConversationsScreen}
          options={{
            headerShown: true,
            title: 'Conversations',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            headerShown: true,
            title: 'Chat',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="AccountScreen" 
          component={AccountScreen}
          options={{
            headerShown: true,
            title: 'Account Settings',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="PrivacyPolicyScreen" 
          component={PrivacyPolicyScreen}
          options={{
            headerShown: true,
            title: 'Privacy Policy',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="TermsOfServiceScreen" 
          component={TermsOfServiceScreen}
          options={{
            headerShown: true,
            title: 'Terms of Service',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="DisclaimerScreen" 
          component={DisclaimerScreen}
          options={{
            headerShown: true,
            title: 'Disclaimer',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="DailyMotivationScreen" 
          component={DailyMotivationScreen}
          options={{
            headerShown: true,
            title: 'Daily Motivation',
            ...defaultPostLoginOptions,
          }}
        />
        <Stack.Screen 
          name="EmotionalAssessmentScreen" 
          component={EmotionalAssessmentScreen}
          options={{
            headerShown: true,
            title: 'Emotional Assessment',
            ...defaultPostLoginOptions,
          }}
        />
        {/* Add the SelfHelpResourcesScreen */}
        <Stack.Screen 
          name="SelfHelpResourcesScreen" 
          component={SelfHelpResourcesScreen}
          options={{
            headerShown: true,
            title: 'Self-Help Resources',
            ...defaultPostLoginOptions,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
