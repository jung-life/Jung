import { useState, useEffect } from 'react';
import * as secureStore from '../lib/secureStorage';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenFeatureTour: boolean;
  lastTourVersion: string;
  skipCount: number;
  firstLoginDate: string | null;
}

const CURRENT_TOUR_VERSION = '1.0.0';
const MAX_SKIP_COUNT = 2; // Allow skipping only twice before forcing completion

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    hasSeenFeatureTour: false,
    lastTourVersion: '',
    skipCount: 0,
    firstLoginDate: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const stored = await secureStore.getItem('onboardingState');
      if (stored) {
        const parsedState = JSON.parse(stored);
        setOnboardingState(parsedState);
      } else {
        // First time user - set initial state
        const initialState: OnboardingState = {
          hasCompletedOnboarding: false,
          hasSeenFeatureTour: false,
          lastTourVersion: '',
          skipCount: 0,
          firstLoginDate: new Date().toISOString()
        };
        await saveOnboardingState(initialState);
        setOnboardingState(initialState);
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingState = async (newState: OnboardingState) => {
    try {
      await secureStore.saveItem('onboardingState', JSON.stringify(newState));
      setOnboardingState(newState);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  const markOnboardingComplete = async () => {
    const newState = {
      ...onboardingState,
      hasCompletedOnboarding: true,
      lastTourVersion: CURRENT_TOUR_VERSION
    };
    await saveOnboardingState(newState);
  };

  const markFeatureTourSeen = async () => {
    const newState = {
      ...onboardingState,
      hasSeenFeatureTour: true,
      lastTourVersion: CURRENT_TOUR_VERSION
    };
    await saveOnboardingState(newState);
  };

  const incrementSkipCount = async () => {
    const newState = {
      ...onboardingState,
      skipCount: onboardingState.skipCount + 1
    };
    await saveOnboardingState(newState);
  };

  const resetOnboarding = async () => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: false,
      hasSeenFeatureTour: false,
      lastTourVersion: '',
      skipCount: 0,
      firstLoginDate: onboardingState.firstLoginDate
    };
    await saveOnboardingState(newState);
  };

  // Determine if user should see onboarding
  const shouldShowOnboarding = () => {
    if (loading) return false;

    // Force onboarding if user has skipped too many times
    if (onboardingState.skipCount >= MAX_SKIP_COUNT) {
      return !onboardingState.hasCompletedOnboarding;
    }

    // Show to new users who haven't completed onboarding
    return !onboardingState.hasCompletedOnboarding;
  };

  // Determine if user should see feature tour (for updates)
  const shouldShowFeatureTour = () => {
    if (loading) return false;

    // Show if completed onboarding but hasn't seen latest tour
    return onboardingState.hasCompletedOnboarding &&
           onboardingState.lastTourVersion !== CURRENT_TOUR_VERSION;
  };

  // Check if user is new (within first 3 days)
  const isNewUser = () => {
    if (!onboardingState.firstLoginDate) return true;

    const firstLogin = new Date(onboardingState.firstLoginDate);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    return firstLogin > threeDaysAgo;
  };

  // Get user journey stage
  const getUserJourneyStage = () => {
    if (!onboardingState.hasCompletedOnboarding) {
      return 'new';
    }

    if (isNewUser()) {
      return 'beginner';
    }

    return 'experienced';
  };

  // Helper to determine what guidance to show
  const getGuidanceLevel = () => {
    const stage = getUserJourneyStage();

    switch (stage) {
      case 'new':
        return 'full'; // Show full onboarding
      case 'beginner':
        return 'moderate'; // Show helpful hints
      case 'experienced':
        return 'minimal'; // Show only new features
      default:
        return 'minimal';
    }
  };

  return {
    onboardingState,
    loading,
    shouldShowOnboarding,
    shouldShowFeatureTour,
    isNewUser,
    getUserJourneyStage,
    getGuidanceLevel,
    markOnboardingComplete,
    markFeatureTourSeen,
    incrementSkipCount,
    resetOnboarding,
    canSkip: onboardingState.skipCount < MAX_SKIP_COUNT,
    skipCount: onboardingState.skipCount,
    maxSkips: MAX_SKIP_COUNT
  };
};