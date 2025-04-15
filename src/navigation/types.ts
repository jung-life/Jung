import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';

export type RootStackParamList = {
  LandingScreen: undefined;
  Login: undefined;
  Register: undefined;
  PostLoginScreen: undefined;
  Home: undefined;
  ConversationsScreen: { refresh?: boolean };
  Chat: { 
    conversationId: string;
    avatarId?: string;
  };
  AccountScreen: undefined;
  PrivacyPolicyScreen: undefined;
  TermsOfServiceScreen: undefined;
  DisclaimerScreen: undefined;
  DailyMotivationScreen: undefined;
  EmotionalAssessmentScreen: undefined;
  SelfHelpResourcesScreen: undefined; // Add the missing screen
  MoodTrackerScreen: undefined; // Add Mood Tracker screen
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
