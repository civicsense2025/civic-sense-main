import { createContext, useContext } from 'react';

// Platform-agnostic toast notifications
// Each platform will provide its own implementation

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
}

// Default no-op implementation
const defaultToast = () => {
  console.warn('Toast provider not found. Make sure to wrap your app with a ToastProvider');
};

export const ToastContext = createContext<ToastContextType>({
  toast: defaultToast,
});

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

// Re-export toast function for direct use
export const toast = (options: ToastOptions | string) => {
  if (typeof window !== 'undefined') {
    const context = useContext(ToastContext);
    context.toast(options);
  } else {
    console.log('Toast attempted server-side:', options);
  }
}; 