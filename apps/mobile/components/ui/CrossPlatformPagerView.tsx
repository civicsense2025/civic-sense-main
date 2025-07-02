import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { Platform, ScrollView, View, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Define the PagerView interface
export interface PagerViewRef {
  setPageWithoutAnimation: (index: number) => void;
}

export interface PagerViewProps {
  style?: any;
  initialPage?: number;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
  overdrag?: boolean;
  orientation?: string;
  offscreenPageLimit?: number;
  onPageScrollStateChanged?: (event: { nativeEvent: { pageScrollState: string } }) => void;
  children: React.ReactNode[];
}

// Import PagerView only on native platforms using safer method
let NativePagerView: any = null;
let pagerViewLoadAttempted = false;

// Function to safely load the native component
const loadNativePagerView = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (pagerViewLoadAttempted) {
    return NativePagerView;
  }
  
  pagerViewLoadAttempted = true;
  
  try {
    // Import react-native-pager-view using a safer approach
    const PagerViewModule = require('react-native-pager-view');
    NativePagerView = PagerViewModule.default || PagerViewModule;
    console.log('✅ PagerView loaded successfully');
  } catch (error) {
    console.warn('⚠️ PagerView not available, falling back to ScrollView:', error instanceof Error ? error.message : String(error));
    NativePagerView = null;
  }
  
  return NativePagerView;
};

export const CrossPlatformPagerView = forwardRef<PagerViewRef, PagerViewProps>(
  ({ 
    style, 
    initialPage = 0, 
    onPageSelected, 
    onPageScrollStateChanged,
    children, 
    ...props 
  }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const currentPageRef = useRef(initialPage);

    // Handle page change for web
    const handleWebPageChange = useCallback((pageIndex: number) => {
      if (pageIndex !== currentPageRef.current) {
        currentPageRef.current = pageIndex;
        if (onPageSelected) {
          onPageSelected({ nativeEvent: { position: pageIndex } });
        }
      }
    }, [onPageSelected]);

    // Handle scroll events on web
    const handleWebScroll = useCallback((event: any) => {
      const { contentOffset } = event.nativeEvent;
      const pageIndex = Math.round(contentOffset.x / screenWidth);
      handleWebPageChange(pageIndex);
    }, [handleWebPageChange]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      setPageWithoutAnimation: (index: number) => {
        currentPageRef.current = index;
        if (Platform.OS === 'web' && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: index * screenWidth,
            animated: false,
          });
        } else if (loadNativePagerView() && ref) {
          // For native platforms, we'd call the native method
          // This is a bit tricky with the current setup, but for now
          // we'll handle it in the parent component
        }
      },
    }), []);

    if (Platform.OS === 'web') {
      // Web implementation using ScrollView
      return (
        <ScrollView
          ref={scrollViewRef}
          style={[{ flex: 1 }, style]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleWebScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: initialPage * screenWidth, y: 0 }}
        >
          {React.Children.map(children, (child, index) => (
            <View key={index} style={{ width: screenWidth, flex: 1 }}>
              {child}
            </View>
          ))}
        </ScrollView>
      );
    }

    // Native implementation using PagerView
    const LoadedPagerView = loadNativePagerView();
    if (LoadedPagerView) {
      return (
        <LoadedPagerView
          ref={ref}
          style={[{ flex: 1 }, style]}
          initialPage={initialPage}
          onPageSelected={onPageSelected}
          onPageScrollStateChanged={onPageScrollStateChanged}
          {...props}
        >
          {children}
        </LoadedPagerView>
      );
    }

    // Fallback if PagerView is not available
    return (
      <View style={[{ flex: 1 }, style]}>
        {children[currentPageRef.current] || children[0]}
      </View>
    );
  }
);

CrossPlatformPagerView.displayName = 'CrossPlatformPagerView'; 