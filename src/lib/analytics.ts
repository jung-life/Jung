// import { mixpanel } from '../App'; // REMOVE THIS IMPORT to break cycle

let mixpanelInstance: any = null;

// Call this from App.tsx after mixpanel is initialized
export const initAnalytics = (instance: any) => {
  mixpanelInstance = instance;
  if (instance) {
    console.log('Analytics initialized with Mixpanel instance.');
  } else {
    console.warn('Analytics initialized with null/undefined Mixpanel instance.');
  }
};

// Safe tracking function that won't crash if mixpanel is undefined or not initialized
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (mixpanelInstance && typeof mixpanelInstance.track === 'function') {
      mixpanelInstance.track(eventName, properties);
    } else {
      // console.log(`[Analytics mock/uninitialized] Track event: ${eventName}`, properties);
      // It might be better to queue events if mixpanelInstance is not yet available,
      // or simply log a warning if it's crucial for events not to be missed.
      // For now, just log if not initialized.
      if (!mixpanelInstance) {
        console.warn(`Mixpanel not initialized. Event "${eventName}" was not tracked.`);
      } else {
        console.log(`[Analytics mock] Track event: ${eventName}`, properties);
      }
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};
