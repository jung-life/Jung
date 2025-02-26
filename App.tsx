import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { useAuth } from './src/hooks/useAuth';
import { LandingScreen } from './src/screens/LandingScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Enable screens before creating the navigator
enableScreens();

const Stack = createNativeStackNavigator();

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          {session ? (
            // Authenticated stack
            <Stack.Screen name="Home" component={HomeScreen} />
          ) : (
            // Non-authenticated stack
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </SafeAreaProvider>
    </NavigationContainer>
  );
} 