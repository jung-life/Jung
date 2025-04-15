import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PostLoginScreen from '../screens/PostLoginScreen';
import SelfHelpResourcesScreen from '../screens/SelfHelpResourcesScreen';
import { DisclaimerScreen } from '../screens/DisclaimerScreen'; // Import DisclaimerScreen
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen'; // Import TermsOfServiceScreen
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen'; // Import PrivacyPolicyScreen

// Note: This navigator is not currently used by the app.
// The app uses AppNavigator.tsx instead.
// This file is kept for reference or potential future use.

export type RootStackParamList = {
  HomeScreen: undefined;
  LoginScreen: undefined;
  PostLoginScreen: undefined;
  SelfHelpResourcesScreen: undefined;
  DisclaimerScreen: undefined; // Add DisclaimerScreen to the param list
  TermsOfServiceScreen: undefined; // Add TermsOfServiceScreen to the param list
  PrivacyPolicyScreen: undefined; // Add PrivacyPolicyScreen to the param list
};

const RootStack = createStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
  return (
    // Removed NavigationContainer to avoid conflicts with AppNavigator
    <RootStack.Navigator>
        <RootStack.Screen 
          name="HomeScreen" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <RootStack.Screen 
          name="LoginScreen" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <RootStack.Screen 
          name="PostLoginScreen" 
          component={PostLoginScreen} 
          options={{ headerShown: false }} 
        />
        <RootStack.Screen 
          name="SelfHelpResourcesScreen" 
          component={SelfHelpResourcesScreen} 
           options={{ headerShown: false }} 
        />
        {/* Add DisclaimerScreen to the navigator */}
        <RootStack.Screen 
          name="DisclaimerScreen" 
          component={DisclaimerScreen} 
          options={{ headerShown: false }} 
        />
        {/* Add TermsOfServiceScreen to the navigator */}
        <RootStack.Screen 
          name="TermsOfServiceScreen" 
          component={TermsOfServiceScreen} 
          options={{ headerShown: false }} 
        />
        {/* Add PrivacyPolicyScreen to the navigator */}
        <RootStack.Screen 
          name="PrivacyPolicyScreen" 
          component={PrivacyPolicyScreen} 
          options={{ headerShown: false }} 
        />
      </RootStack.Navigator>
  );
};

export default RootStackNavigator;
