import { mixpanel } from '../App'; // Import from where you defined it

// Safe tracking function that won't crash if mixpanel is undefined
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (mixpanel && typeof mixpanel.track === 'function') {
      mixpanel.track(eventName, properties);
    } else {
      console.log(`[Analytics mock] Track event: ${eventName}`, properties);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}; 