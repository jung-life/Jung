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
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import { navigationRef } from './navigationService';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Default header options
const defaultPostLoginOptions = {
  headerStyle: {
    backgroundColor: '#ffffff',
  },
  headerTintColor: '#4A3B78',
  headerTitleStyle: {
    fontWeight: 'bold' as const,
  },
};

// Header options with hamburger menu
const headerWithHamburgerMenu = {
  ...defaultPostLoginOptions,
  headerRight: () => <HamburgerMenu />,
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
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            headerShown: true,
            title: 'Home',
            ...headerWithHamburgerMenu,
          }}
        />
        {/* No hamburger menu on Conversations Screen to avoid duplication */}
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
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="AccountScreen" 
          component={AccountScreen}
          options={{
            headerShown: true,
            title: 'Account Settings',
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="PrivacyPolicyScreen" 
          component={PrivacyPolicyScreen}
          options={{
            headerShown: true,
            title: 'Privacy Policy',
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="TermsOfServiceScreen" 
          component={TermsOfServiceScreen}
          options={{
            headerShown: true,
            title: 'Terms of Service',
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="DisclaimerScreen" 
          component={DisclaimerScreen}
          options={{
            headerShown: true,
            title: 'Disclaimer',
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="DailyMotivationScreen" 
          component={DailyMotivationScreen}
          options={{
            headerShown: true,
            title: 'Daily Motivation',
            ...headerWithHamburgerMenu,
          }}
        />
        <Stack.Screen 
          name="EmotionalAssessmentScreen" 
          component={EmotionalAssessmentScreen}
          options={{
            headerShown: true,
            title: 'Emotional Assessment',
            ...headerWithHamburgerMenu,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
