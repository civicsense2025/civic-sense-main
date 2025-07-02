declare module 'hooks' {
  import { DependencyList } from 'react';

  export function useCustomHook<T>(deps?: DependencyList): T;
  export function useFeatureFlag(flag: string): boolean;
  export function usePremium(): {
    isPremium: boolean;
    isPro: boolean;
    hasFeatureAccess: (feature: string) => boolean;
  };
} 