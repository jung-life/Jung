declare module '@react-native-voice/voice' {
  interface SpeechResultsEvent {
    value?: string[];
  }
  interface SpeechErrorEvent {
    error?: {
      code?: string;
      message?: string;
    };
  }
  interface VoiceEvents {
    onSpeechStart?: (e: any) => void; // You can use a more specific type if available or define one
    onSpeechEnd?: (e: any) => void; // You can use a more specific type if available or define one
    onSpeechResults?: (e: SpeechResultsEvent) => void;
    onSpeechError?: (e: SpeechErrorEvent) => void;
    onSpeechRecognized?: (e: any) => void; // You can use a more specific type if available or define one
    onSpeechPartialResults?: (e: SpeechResultsEvent) => void;
    onSpeechVolumeChanged?: (e: { value?: number }) => void;
  }
  const Voice: VoiceEvents & {
    start: (locale?: string, options?: any) => Promise<void>;
    stop: () => Promise<void>;
    cancel: () => Promise<void>;
    destroy: () => Promise<void>;
    isAvailable: () => Promise<boolean>;
    isRecognizing: () => Promise<boolean>;
    removeAllListeners: () => void;
    // Add other methods if you use them
  };
  export default Voice;
}

declare module 'expo-speech' {
  interface SpeechErrorEvent {
    error: string;
  }
  interface SpeakOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (event: SpeechErrorEvent) => void; // More specific error type
  }
  export function speak(text: string, options?: SpeakOptions): void;
  export function stop(): void;
  export function getAvailableVoicesAsync(): Promise<SpeechVoice[]>;
  export function isSpeakingAsync(): Promise<boolean>;
  // Add other functions and types from expo-speech as needed
  export interface SpeechVoice {
    identifier: string;
    name: string;
    quality: 'Default' | 'Enhanced';
    language: string;
  }
}

// For expo-av, types are usually included, but if specific errors persist for Audio,
// you might add a more specific declaration or ensure your tsconfig is set up for Expo.
// For now, we assume expo-av types are generally okay or covered by the Expo SDK's global types.
// If 'Cannot find module expo-av' specifically appears, you could add:
/*
declare module 'expo-av' {
  export const Audio: any; // Or more specific types if known
  // Add other exports from expo-av if needed
}
*/
