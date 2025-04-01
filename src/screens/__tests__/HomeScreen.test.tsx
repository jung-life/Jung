import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { View } from 'react-native';

// Mock dependencies
jest.mock('../../components/GradientBackground', () => ({
  GradientBackground: ({ children }: { children: React.ReactNode }) => (
    <View testID="gradient-background">{children}</View>
  )
}));

jest.mock('../../components/SymbolicBackground', () => ({
  SymbolicBackground: ({ opacity }: { opacity: number }) => null
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock supabase
const mockSignOut = jest.fn().mockResolvedValue({});
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: mockSignOut,
    },
  },
}));

// Mock phosphor icons
jest.mock('phosphor-react-native', () => ({
  Heart: 'HeartIcon',
  Brain: 'BrainIcon',
  ChatCircle: 'ChatCircleIcon',
  Gauge: 'GaugeIcon',
}));

// Mock tailwind
jest.mock('../../lib/tailwind', () => ({
  __esModule: true,
  default: (style: string) => style, // Just return the style string for testing
}));

describe('HomeScreen', () => {
  // Reset mocks before each test
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSignOut.mockClear();
  });

  it('renders the welcome message correctly', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome to Jung')).toBeTruthy();
    expect(getByText('Your companion for psychological exploration and growth')).toBeTruthy();
  });

  it('renders all the feature cards', () => {
    const { getByText } = render(<HomeScreen />);
    
    // Check all card titles are present
    expect(getByText('Emotional Assessment')).toBeTruthy();
    expect(getByText('Daily Motivation')).toBeTruthy();
    expect(getByText('Conversations')).toBeTruthy();
    expect(getByText('Your Profile')).toBeTruthy();
  });

  it('navigates to Emotional Assessment screen when card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Emotional Assessment'));
    expect(mockNavigate).toHaveBeenCalledWith('EmotionalAssessmentScreen');
  });

  it('navigates to Daily Motivation screen when card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Daily Motivation'));
    expect(mockNavigate).toHaveBeenCalledWith('DailyMotivationScreen');
  });

  it('navigates to Conversations screen when card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Conversations'));
    expect(mockNavigate).toHaveBeenCalledWith('ConversationsScreen', { refresh: false });
  });

  it('navigates to Account screen when profile card is pressed', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Your Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('AccountScreen');
  });

  it('calls signOut function when Sign Out button is pressed', async () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
