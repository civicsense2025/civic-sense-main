import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { 
  breakpoints, 
  getDeviceType, 
  responsive,
  deviceStyles,
  type DeviceType 
} from '../theme';

interface ScreenData {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

interface ResponsiveHook {
  // Current screen data
  screen: ScreenData;
  
  // Device type detection
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Responsive utilities
  getValue: <T>(values: {
    mobile?: T;
    small?: T;
    medium?: T;
    large?: T;
    extraLarge?: T;
    default: T;
  }) => T;
  
  getSpacing: (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }) => number;
  
  getFontSize: (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }) => number;
  
  // Device-specific styles
  getDeviceStyles: (component: keyof typeof deviceStyles) => any;
  
  // Breakpoint checks
  isDevice: (device: keyof typeof breakpoints) => boolean;
  
  // Media query helpers
  matchesQuery: (query: string) => boolean;
}

export const useResponsive = (): ResponsiveHook => {
  const [screenData, setScreenData] = useState<ScreenData>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return { width, height, scale, fontScale };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    });

    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(screenData.width);
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'small' || deviceType === 'medium';
  const isDesktop = deviceType === 'large' || deviceType === 'extraLarge';
  const isPortrait = screenData.height > screenData.width;
  const isLandscape = screenData.width > screenData.height;

  const getValue = <T>(values: {
    mobile?: T;
    small?: T;
    medium?: T;
    large?: T;
    extraLarge?: T;
    default: T;
  }): T => {
    return responsive.getValue(values, screenData.width);
  };

  const getSpacing = (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }): number => {
    return responsive.getSpacing(values, screenData.width);
  };

  const getFontSize = (values: {
    mobile?: number;
    small?: number;
    medium?: number;
    large?: number;
    extraLarge?: number;
    default: number;
  }): number => {
    return responsive.getFontSize(values, screenData.width);
  };

  const getDeviceStyles = (component: keyof typeof deviceStyles) => {
    const styles = deviceStyles[component];
    if (isMobile) return styles.mobile;
    if (isTablet) return styles.tablet;
    return styles.desktop;
  };

  const isDevice = (device: keyof typeof breakpoints): boolean => {
    return responsive.isDevice(device, screenData.width);
  };

  const matchesQuery = (query: string): boolean => {
    // Simple media query matching for common patterns
    const width = screenData.width;
    const height = screenData.height;
    
    // Parse basic media queries
    if (query.includes('max-width')) {
      const match = query.match(/max-width:\s*(\d+)px/);
      if (match && match[1]) {
        const maxWidth = parseInt(match[1], 10);
        return width <= maxWidth;
      }
    }
    
    if (query.includes('min-width')) {
      const match = query.match(/min-width:\s*(\d+)px/);
      if (match && match[1]) {
        const minWidth = parseInt(match[1], 10);
        return width >= minWidth;
      }
    }
    
    if (query.includes('orientation: portrait')) {
      return isPortrait;
    }
    
    if (query.includes('orientation: landscape')) {
      return isLandscape;
    }
    
    return false;
  };

  return {
    screen: screenData,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    getValue,
    getSpacing,
    getFontSize,
    getDeviceStyles,
    isDevice,
    matchesQuery,
  };
};

// Additional utility hooks
export const useBreakpoint = () => {
  const { deviceType, screen } = useResponsive();
  return {
    deviceType,
    width: screen.width,
    height: screen.height,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'small' || deviceType === 'medium',
    isDesktop: deviceType === 'large' || deviceType === 'extraLarge',
  };
};

export const useOrientation = () => {
  const { isPortrait, isLandscape, screen } = useResponsive();
  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape',
    aspectRatio: screen.width / screen.height,
  };
}; 