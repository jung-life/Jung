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

const AppNavigator = () => {
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const { session, isNewUser } = useAuth();
  const user = session?.user;

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="LandingScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LandingScreen" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ConversationsScreen" component={ConversationsScreen} />
        <Stack.Screen name="DailyMotivationScreen" component={DailyMotivationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;