import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { DisclaimerScreen } from '../screens/DisclaimerScreen';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { supabase } from '../lib/supabase';

const Stack = createStackNavigator();

// Add this function to check if user has seen disclaimer
const checkDisclaimerStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer')
      .eq('user_id', user.id)
      .single();
      
    if (error || !data) {
      // If no record exists, create one with default values
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_seen_disclaimer: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      return false;
    }
    
    return data.has_seen_disclaimer;
  } catch (error) {
    console.error('Error checking disclaimer status:', error);
    return false;
  }
};

const AppNavigator = () => {
  const [hasSeenDisclaimer, setHasSeenDisclaimer] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkDisclaimerStatus();
      setHasSeenDisclaimer(status);
    };
    
    checkStatus();
  }, []);
  
  if (hasSeenDisclaimer === null) {
    // Still loading, show a loading screen
    return <LoadingScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenDisclaimer ? (
        <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      ) : (
        <>
          <Stack.Screen name="Conversations" component={ConversationsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default Navigation; 