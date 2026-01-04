export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export const logError = (error: Error | string) => {
  const log: ErrorLog = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'object' ? error.stack : undefined,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // In a real application, you would send this to your backend or logging service
  console.error('[ErrorMonitor]', log);
  
  // Example of sending to backend:
  // fetch('/api/logs/error', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(log)
  // }).catch(console.error);
};

export const initErrorMonitoring = () => {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || 'Unhandled Rejection');
  });
};
