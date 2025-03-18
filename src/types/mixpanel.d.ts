declare module 'mixpanel-react-native' {
  interface Mixpanel {
    init(token: string, options?: { trackAutomaticEvents?: boolean }): void;
    track(event: string, properties?: Record<string, any>): void;
  }

  const mixpanel: Mixpanel;
  export default mixpanel;
} 