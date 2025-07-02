import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Define the PagerView interface (same as native version)
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

// Web-only implementation using ScrollView
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
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: index * screenWidth,
            animated: false,
          });
        }
      },
    }), []);

    // Web implementation using ScrollView with paging
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
        onScrollBeginDrag={() => {
          if (onPageScrollStateChanged) {
            onPageScrollStateChanged({ nativeEvent: { pageScrollState: 'dragging' } });
          }
        }}
        onScrollEndDrag={() => {
          if (onPageScrollStateChanged) {
            onPageScrollStateChanged({ nativeEvent: { pageScrollState: 'settling' } });
          }
        }}
        onMomentumScrollEnd={() => {
          if (onPageScrollStateChanged) {
            onPageScrollStateChanged({ nativeEvent: { pageScrollState: 'idle' } });
          }
        }}
      >
        {React.Children.map(children, (child, index) => (
          <View key={index} style={{ width: screenWidth, flex: 1 }}>
            {child}
          </View>
        ))}
      </ScrollView>
    );
  }
);

CrossPlatformPagerView.displayName = 'CrossPlatformPagerView'; 
 