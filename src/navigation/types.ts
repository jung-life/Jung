import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';

export type RootStackParamList = {
  LandingScreen: undefined;
  Login: undefined;
  Register: undefined;
  MotivationalSplashScreen: undefined; // Add Motivational Splash screen
  PostLoginScreen: undefined;
  Home: undefined;
  ConversationsScreen: { refresh?: boolean };
  Subscription: undefined;
  ConversationHistoryScreen: undefined;
  ConversationInsightsScreen: { conversationId?: string };
  'ConversationHistoryScreen-enhanced': undefined; // Add enhanced history screen (quoted)
  'ConversationInsightsScreen-enhanced': { conversationId?: string }; // Add enhanced insights screen (quoted)
  Chat: { 
    conversationId: string;
    avatarId?: string;
    isNewConversation?: boolean;
  };
  AccountScreen: undefined;
  PrivacyPolicyScreen: undefined;
  TermsOfServiceScreen: undefined;
  DisclaimerScreen: undefined;
  DailyMotivationScreen: undefined;
  EmotionalAssessmentScreen: undefined;
  SelfHelpResourcesScreen: undefined; // Add the missing screen
  MoodTrackerScreen: undefined; // Add Mood Tracker screen
  LoadingScreen: undefined; // Add LoadingScreen
  JournalingScreen: undefined; // Add Journaling screen
  SettingsScreen: undefined; // Add Settings screen
  TransactionHistory: undefined; // Add Transaction History screen
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
