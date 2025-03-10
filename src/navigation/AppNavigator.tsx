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
import ConversationScreen from '../screens/ConversationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PostLoginScreen } from '../screens/PostLoginScreen';

Account: undefined;

// Create the stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const { session, isNewUser } = useAuth();
const user = session?.user;

<Stack.Navigator 
  initialRouteName="Landing" 
  screenOptions={{ headerShown: false }}
>
  <Stack.Screen name="Landing" component={LandingScreen} />
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} />
  {!user ? (
    <>
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>
  ) : isNewUser ? (
    <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
  ) : (
    <>
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </>
  )}
</Stack.Navigator> 