import React, { createContext, useContext } from 'react';
import { useUIStrings } from '../hooks/useUIStrings';
import type { UIStringPath } from '@civicsense/business-logic/strings/ui-strings';

interface UIStringsContextType {
  t: (path: UIStringPath, vars?: Record<string, string | number>) => string;
  language: string;
}

const UIStringsContext = createContext<UIStringsContextType | null>(null);

export function UIStringsProvider({ children }: { children: React.ReactNode }) {
  const strings = useUIStrings();

  return (
    <UIStringsContext.Provider value={strings}>
      {children}
    </UIStringsContext.Provider>
  );
}

export function useStrings() {
  const context = useContext(UIStringsContext);
  if (!context) {
    throw new Error('useStrings must be used within a UIStringsProvider');
  }
  return context;
} 