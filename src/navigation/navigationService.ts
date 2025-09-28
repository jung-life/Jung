import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Queue for navigation actions that are attempted before the navigator is ready
let pendingNavigationActions: Array<() => void> = [];

// Process any pending navigation actions
export function processPendingNavigationActions() {
  if (navigationRef.isReady()) {
    console.log(`Processing ${pendingNavigationActions.length} pending navigation actions`);
    
    // Execute all pending actions
    pendingNavigationActions.forEach(action => action());
    
    // Clear the queue
    pendingNavigationActions = [];
  }
}

export function navigate(name: keyof RootStackParamList, params?: any) {
  console.log(`Navigation requested to: ${name}`, params);

  if (navigationRef.current && navigationRef.isReady()) {
    console.log(`Navigator is ready, navigating to: ${name}`);

    try {
      // Use CommonActions for more reliable navigation
      navigationRef.current.dispatch(
        CommonActions.navigate({
          name,
          params,
        })
      );
    } catch (error) {
      console.error(`Error navigating to ${name}:`, error);

      // Check if the route exists in current navigator
      try {
        const state = navigationRef.current.getRootState();
        console.log('Current navigation state during error:', {
          routeNames: state.routeNames,
          index: state.index,
          currentRoute: state.routes[state.index]?.name
        });
      } catch (stateError) {
        console.error('Error getting navigation state:', stateError);
      }

      // Queue the navigation for later if it failed
      console.log(`Queueing navigation to ${name} for later execution`);
      pendingNavigationActions.push(() => navigate(name, params));
    }
  } else {
    // If navigator is not ready, queue for later
    console.log(`Navigator not ready for navigate to: ${name}. Queuing for later.`);
    pendingNavigationActions.push(() => navigate(name, params));
  }
}

export function reset(name: keyof RootStackParamList) {
  console.log(`Reset requested to: ${name}`);

  if (navigationRef.current && navigationRef.isReady()) {
    console.log(`Navigator is ready, resetting to: ${name}`);

    try {
      // Check if the route exists in the current navigator
      const state = navigationRef.current.getRootState();
      console.log('Current navigation state:', JSON.stringify(state, null, 2));

      navigationRef.current.reset({
        index: 0,
        routes: [{ name }],
      });
    } catch (error) {
      console.error(`Error resetting to ${name}:`, error);
      console.log(`Attempting navigate instead of reset to: ${name}`);

      // Fallback to navigate if reset fails
      try {
        navigationRef.current.navigate(name as any);
      } catch (navigateError) {
        console.error(`Navigate fallback also failed for ${name}:`, navigateError);
        console.log('Navigation will be handled by state change instead');
      }
    }
  } else {
    // If navigator is not ready, do nothing. Navigation should be handled declaratively.
    console.log(`Navigator not ready for reset to: ${name}. Navigation will be handled by state change.`);
  }
}
