import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.current && navigationRef.isReady()) {
    navigationRef.current.navigate(name, params);
  } else {
    // Save the navigation for when the navigator is ready
    console.log('Navigation attempted before navigator was ready');
  }
}

export function reset(name: keyof RootStackParamList) {
  if (navigationRef.current && navigationRef.isReady()) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name }],
    });
  }
} 