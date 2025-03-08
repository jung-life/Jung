import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConversationScreen } from '../screens/ConversationScreen';
import { ReflectionsPage } from '../screens/ReflectionsPage';
import { DailyMotivationScreen } from '../screens/DailyMotivationScreen';
import { PostLoginScreen } from '../screens/PostLoginScreen';

export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
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
};

// Add these types for navigation
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>; 