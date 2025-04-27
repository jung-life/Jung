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
    
    // Use CommonActions for more reliable navigation
    navigationRef.current.dispatch(
      CommonActions.navigate({
        name,
        params,
      })
    );
  } else {
    // If navigator is not ready, do nothing. Navigation should be handled declaratively.
    console.log(`Navigator not ready for navigate to: ${name}. Navigation will be handled by state change.`);
  }
}

export function reset(name: keyof RootStackParamList) {
  console.log(`Reset requested to: ${name}`);
  
  if (navigationRef.current && navigationRef.isReady()) {
    console.log(`Navigator is ready, resetting to: ${name}`);
    navigationRef.current.reset({
      index: 0,
      routes: [{ name }],
    });
  } else {
    // If navigator is not ready, do nothing. Navigation should be handled declaratively.
    console.log(`Navigator not ready for reset to: ${name}. Navigation will be handled by state change.`);
  }
}
