// In AppNavigator.tsx
import React, { useEffect } from 'react'; // Added useEffect
import { TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import * as Notifications from 'expo-notifications'; // Added Notifications
import HomeButton from '../components/HomeButton'; // Import HomeButton component
import { AccountScreen } from '../screens/AccountScreen';
import LandingScreen from '../screens/LandingScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { DisclaimerScreen } from '../screens/DisclaimerScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext'; // Use the AuthContext hook
import { RootStackParamList } from './types';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import PostLoginScreen from '../screens/PostLoginScreen';
// Remove NavigationContainer import from here
import DailyMotivationScreen from '../screens/DailyMotivationScreen';
import { EmotionalAssessmentScreen } from '../screens/EmotionalAssessmentScreen';
import SelfHelpResourcesScreen from '../screens/SelfHelpResourcesScreen';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/TermsOfServiceScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen'; // Import MoodTrackerScreen
import JournalingScreen from '../screens/JournalingScreen-Simple'; // Import JournalingScreen (Simple version for testing)
import { ConversationHistoryScreen } from '../screens/ConversationHistoryScreen';
import { ConversationInsightsScreen } from '../screens/ConversationInsightsScreen';
import { ConversationInsightsScreenEnhanced } from '../screens/ConversationInsightsScreen-enhanced';
import { navigationRef } from './navigationService';
import { LoadingScreen } from '../screens/LoadingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen'; 
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen'; // Import TransactionHistoryScreen
import { MotivationalSplashScreen } from '../screens/MotivationalSplashScreen'; // Import MotivationalSplashScreen

// Stack for AuthScreen and MainAppScreen flow
const Stack = createNativeStackNavigator<RootStackParamList>();
// New Stack specifically for the Loading state
const LoadingStateStack = createNativeStackNavigator<{ LoadingScreen: undefined }>();

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
    {/* Add legal screens accessible from Register */}
    <Stack.Screen name="TermsOfServiceScreen" component={TermsOfServiceScreen} />
    <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
    <Stack.Screen name="DisclaimerScreen" component={DisclaimerScreen} />
  </Stack.Navigator>
);

// Define Disclaimer Stack - for new users who haven't accepted disclaimer
const DisclaimerStack = () => (
  <Stack.Navigator
    initialRouteName="DisclaimerScreen"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen
      name="DisclaimerScreen"
      component={DisclaimerScreen}
      options={{ 
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
      }}
    />
  </Stack.Navigator>
);

// Define Main App Stack - for users who have accepted disclaimer
const MainAppStack = () => (
  <Stack.Navigator
    initialRouteName="MotivationalSplashScreen"
    screenOptions={{ headerShown: false, ...defaultPostLoginOptions }} 
  >
    {/* Motivational splash screen shown after login */}
    <Stack.Screen
      name="MotivationalSplashScreen"
      component={MotivationalSplashScreen}
      options={{ headerShown: false }} // No header for splash screen
    />
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
      options={{ 
        headerShown: true, 
        title: 'Daily Motivation', 
        headerLeft: () => <HomeButton destination="PostLoginScreen" />,
        headerBackVisible: false 
      }}
    />
    <Stack.Screen
      name="EmotionalAssessmentScreen"
      component={EmotionalAssessmentScreen}
      options={{ 
        headerShown: true, 
        title: 'Emotional Assessment',
        headerLeft: () => <HomeButton destination="PostLoginScreen" />,
        headerBackVisible: false
      }}
    />
    <Stack.Screen
      name="SelfHelpResourcesScreen"
      component={SelfHelpResourcesScreen}
      options={{ 
        headerShown: true, 
        title: 'Self-Help Resources', 
        headerLeft: () => <HomeButton destination="PostLoginScreen" />,
        headerBackVisible: false 
      }}
    />
    <Stack.Screen // Add MoodTrackerScreen
      name="MoodTrackerScreen"
      component={MoodTrackerScreen}
      options={{ 
        headerShown: true, 
        title: 'Mood Tracker',
        headerLeft: () => <HomeButton destination="PostLoginScreen" />,
        headerRight: () => <HamburgerMenu />, // Explicitly set headerRight
        headerBackVisible: false,
      }}
    />
    <Stack.Screen // Add JournalingScreen
      name="JournalingScreen"
      component={JournalingScreen}
      options={{ 
        headerShown: true, 
        title: 'Journal', 
        headerLeft: () => <HomeButton destination="PostLoginScreen" />,
        headerBackVisible: false 
      }}
    />
    <Stack.Screen
      name="ConversationHistoryScreen"
      component={ConversationHistoryScreen}
      options={{ headerShown: true, title: 'Conversation History' }}
    />
    <Stack.Screen
      name="ConversationInsightsScreen"
      component={ConversationInsightsScreen}
      options={{ headerShown: true, title: 'Conversation Insights' }}
    />
    <Stack.Screen
      name="ConversationInsightsScreen-enhanced"
      component={ConversationInsightsScreenEnhanced}
      options={{ headerShown: true, title: 'Conversation Insights' }}
    />
    <Stack.Screen
      name="SettingsScreen"
      component={SettingsScreen}
      options={{ headerShown: true, title: 'Settings' }}
    />
    <Stack.Screen 
      name="Subscription" 
      component={SubscriptionScreen}
      options={{ headerShown: true, title: 'Subscription' }}
    />
    <Stack.Screen 
      name="TransactionHistory" 
      component={TransactionHistoryScreen}
      options={{ headerShown: true, title: 'Transaction History' }}
    />
  </Stack.Navigator>
);


const AppNavigator = () => {
  const { session, isNewUser, loading } = useAuth();
  const user = session?.user;

  useEffect(() => {
    // Listener for when a user taps on a notification (app is in foreground, background, or killed)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const navigateTo = response.notification.request.content.data?.navigateTo;
      console.log('Navigate to data:', navigateTo);

      if (navigateTo && navigationRef.isReady()) {
        // Ensure navigationRef is ready before attempting to navigate
        // Type assertion might be needed if navigateTo values are not strictly in RootStackParamList
        if (navigateTo === 'Home') {
          navigationRef.navigate('Home' as any); 
        }
        // Add other navigation targets if needed
        // else if (navigateTo === 'SomeOtherScreen') {
        //   navigationRef.navigate('SomeOtherScreen' as any, { someParam: 'value' });
        // }
      }
    });

    // Check if the app was opened by a notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        console.log('App opened by notification (getLastNotificationResponseAsync):', response);
        const navigateTo = response.notification.request.content.data?.navigateTo;
        if (navigateTo && navigationRef.isReady()) {
          if (navigateTo === 'Home') {
            navigationRef.navigate('Home' as any);
          }
        } else if (navigateTo) {
          // Handle case where navigator is not ready yet (e.g. queue action)
          // For simplicity, this example assumes it will be ready soon or relies on listener above.
          console.warn('Navigator not ready when app opened by notification, navigation might be missed.');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Show loading screen while checking auth state
  if (loading) {
    // Ensure LoadingScreen is part of a navigator
    return (
      <LoadingStateStack.Navigator screenOptions={{ headerShown: false }}>
        <LoadingStateStack.Screen name="LoadingScreen" component={LoadingScreen} />
      </LoadingStateStack.Navigator>
    );
  }

  // Return the appropriate stack based on auth state and disclaimer status
  // NavigationContainer will be handled in App.tsx
  if (!user) {
    // User not authenticated - show auth flow
    return <AuthStack />;
  } else if (isNewUser) {
    // User authenticated but hasn't accepted disclaimer - show disclaimer only
    return <DisclaimerStack />;
  } else {
    // User authenticated and has accepted disclaimer - show main app
    return <MainAppStack />;
  }
};

export default AppNavigator;
