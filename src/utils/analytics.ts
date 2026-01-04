export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  // In a real application, this would send data to an analytics service like Mixpanel, GA, or a custom backend.
  // For now, we log to the console to verify the tracking point.
  console.log(`[Analytics] Event: ${eventName}`, properties);
};
