import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmotionalAssessmentScreen } from '../EmotionalAssessmentScreen';
import { Text, TouchableOpacity, View } from 'react-native';

// Mock dependencies
jest.mock('../../components/GradientBackground', () => ({
  GradientBackground: ({ children, variant }: { children: React.ReactNode, variant?: string }) => (
    <View testID="gradient-background">{children}</View>
  )
}));

jest.mock('../../components/SymbolicBackground', () => ({
  SymbolicBackground: ({ opacity, variant }: { opacity: number, variant?: string }) => null
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => (
    <View testID="safe-area">{children}</View>
  )
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({ error: null }),
    }),
  },
}));

// Mock API functions
jest.mock('../../lib/api', () => ({
  generateAIResponse: jest.fn().mockResolvedValue(JSON.stringify({
    primary_emotion: 'joy',
    secondary_emotions: ['trust', 'anticipation'],
    intensity: 7,
    triggers: ['Social interactions', 'Unexpected challenges'],
    needs: ['Connection', 'Recognition']
  }))
}));

jest.mock('../../lib/encryptionUtils', () => ({
  encryptData: jest.fn().mockReturnValue('encrypted-data'),
}));

// Mocks for other components and modules
jest.mock('phosphor-react-native', () => ({
  ArrowLeft: 'ArrowLeftIcon',
  Heart: 'HeartIcon',
  ChartBar: 'ChartBarIcon',
  Brain: 'BrainIcon',
  Lightbulb: 'LightbulbIcon',
  Scales: 'ScalesIcon',
  Plant: 'PlantIcon',
  ArrowRight: 'ArrowRightIcon',
  CaretRight: 'CaretRightIcon',
  CaretLeft: 'CaretLeftIcon',
}));

describe('EmotionalAssessmentScreen', () => {
  it('renders the initial assessment UI correctly', () => {
    const { getByText, getByTestId } = render(<EmotionalAssessmentScreen />);
    // Test that the screen title renders correctly
    expect(getByText('Emotional Assessment')).toBeTruthy();
  });

  it('allows users to toggle between quick and comprehensive assessment', () => {
    const { getByText } = render(<EmotionalAssessmentScreen />);
    
    // Test quick assessment option is visible
    expect(getByText('Quick Assessment')).toBeTruthy();
    
    // Test comprehensive option is visible
    expect(getByText('Comprehensive')).toBeTruthy();
    
    // Test switching between modes
    fireEvent.press(getByText('Comprehensive'));
    // Add assertions for what should change
  });

  it('handles response selection correctly', () => {
    const { getAllByText } = render(<EmotionalAssessmentScreen />);
    
    // Find an option button and press it
    const optionButtons = getAllByText(/I feel|I'm|My heart|I trust|I'm caught/);
    if (optionButtons.length > 0) {
      fireEvent.press(optionButtons[0]);
      // Add assertions for what should happen after pressing an option
    }
  });

  it('shows loading state during analysis', () => {
    // This would require setup to get the component into the loading state
    // Maybe using a mock implementation of useState
  });

  it('displays emotional profile results correctly', () => {
    // This would require setup to get the component into the results state
    // by mocking useState and completing the assessment
  });
});
