import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import DailyMotivationScreen from '../screens/DailyMotivationScreen';

export type RootStackParamList = {
  LandingScreen: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Chat: { 
    conversationId: string;
    avatarId?: string;
    title?: string;
  };
  Disclaimer: undefined;
  Settings: undefined;
  Profile: undefined;
  AccountScreen: undefined;
  SecurityScreen: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  ReflectionsPage: undefined;
  DailyMotivationScreen: undefined;
  PostLoginScreen: undefined;
  Account: undefined;
  Auth: undefined;
  ConversationsScreen: { refresh?: boolean };
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 