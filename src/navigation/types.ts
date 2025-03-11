import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';

export type RootStackParamList = {
  LandingScreen: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Conversations: { refresh?: boolean };
  Chat: { conversationId: string };
  Disclaimer: undefined;
  Settings: undefined;
  Profile: undefined;
  AccountScreen: undefined;
  SecurityScreen: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  ConversationScreen: undefined;
  ReflectionsPage: undefined;
  DailyMotivationScreen: undefined;
  PostLoginScreen: undefined;
  Account: undefined;
  Auth: undefined;
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 