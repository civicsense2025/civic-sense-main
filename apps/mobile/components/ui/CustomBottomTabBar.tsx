import React from 'react';
import { View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { spacing, borderRadius, maxContentWidth, shadows, fontFamily } from '../../lib/theme';
import { useUIStrings } from '../../lib/hooks/useUIStrings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate responsive tab bar height
const getTabBarHeight = (bottomInset: number) => {
  const baseHeight = 72;
  const scale = Math.min(SCREEN_WIDTH / 375, 1.5); // Cap at 1.5x
  const calculatedHeight = Math.min(baseHeight * scale, 96); // Cap at 96px
  return calculatedHeight + bottomInset;
};

function TabBarIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const scale = Math.min(SCREEN_WIDTH / 375, 1.2); // Reduced scale for tighter spacing
  const iconSize = Math.min(20 * scale, 24); // Smaller icon size
  
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: iconSize,
      height: iconSize,
      marginBottom: -1, // Reduced margin to bring emoji closer to text
    }}>
      <Text style={{ 
        fontSize: Math.min(16 * scale, 18), // Smaller emoji size
        color: color,
        opacity: focused ? 1 : 0.6,
        fontFamily: fontFamily.mono, // Use Space Mono font
        lineHeight: Math.min(20 * scale, 24), // Increased line height for better emoji spacing
        includeFontPadding: false, // Prevent extra padding on Android
      }}>
        {name}
      </Text>
    </View>
  );
}

interface CustomBottomTabBarProps extends BottomTabBarProps {
  primaryAction?: React.ReactNode;
}

export function CustomBottomTabBar({ state, descriptors, navigation, primaryAction }: CustomBottomTabBarProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { uiStrings } = useUIStrings();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(bottom);
  const scale = Math.min(SCREEN_WIDTH / 375, 1.5);

  // Early return if uiStrings is not ready to prevent crashes
  if (!uiStrings) {
    return null;
  }

  // Filter routes based on authentication status
  const getVisibleRoutes = () => {
    return state.routes.filter(route => {
      // Always show home and quiz
      if (route.name === 'index' || route.name === 'quiz') {
        return true;
      }
      
      // Only show saved and profile for authenticated users
      if (route.name === 'saved' || route.name === 'profile') {
        return !!user;
      }
      
      // Show all other routes by default
      return true;
    });
  };

  const visibleRoutes = getVisibleRoutes();

  const getTabIcon = (routeName: string) => {
    switch (routeName) {
      case 'index': return '🏠';
      case 'quiz': return '🧠';
      case 'saved': return '📚';
      case 'profile': return '👤';
      case 'discover': return '🧭';
      case 'multiplayer': return '👥';
      default: return '?';
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index': return uiStrings?.navigation?.home || 'Home';
      case 'quiz': return uiStrings?.learn?.title || 'Quiz';
      case 'saved': return uiStrings?.saved?.title || 'Saved';
      case 'profile': return uiStrings?.profile?.title || 'Profile';
      case 'discover': return 'Discover';
      case 'multiplayer': return 'Play';
      default: return routeName;
    }
  };

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    }}>
      {/* Primary Action Area */}
      {primaryAction && (
        <View style={{
          backgroundColor: theme.background,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xs,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          ...shadows.card,
        }}>
          {primaryAction}
        </View>
      )}
      
      {/* Tab Bar */}
      <View style={{
        backgroundColor: theme.background,
        borderTopWidth: primaryAction ? 0 : 1,
        borderTopColor: theme.border,
        elevation: 0,
        shadowOpacity: primaryAction ? 0 : 0.1,
        shadowRadius: primaryAction ? 0 : 8,
        shadowOffset: { width: 0, height: -4 },
        height: tabBarHeight,
        paddingTop: spacing.sm * scale,
        paddingBottom: Math.max(spacing.sm * scale, bottom || 0),
        paddingHorizontal: spacing.md * scale,
        maxWidth: maxContentWidth,
        marginHorizontal: 'auto',
        alignSelf: 'center',
        width: '100%',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          flex: 1,
        }}>
          {visibleRoutes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            
            const { options } = descriptor;
            const label = getTabLabel(route.name);
            
            // Find the correct index in the original state for focus detection
            const originalIndex = state.routes.findIndex(r => r.key === route.key);
            const isFocused = state.index === originalIndex;
            
            // Skip hidden routes (check if tab is displayed)
            if (options.tabBarStyle && (options.tabBarStyle as any).display === 'none') {
              return null;
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={`tab-${route.name}`}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.xs * scale,
                  minWidth: Math.min(80 * scale, 120),
                }}
              >
                <TabBarIcon 
                  name={getTabIcon(route.name)} 
                  focused={isFocused} 
                  color={isFocused ? theme.primary : theme.foregroundSecondary} 
                />
                <Text style={{
                  fontSize: Math.min(10 * scale, 12), // Slightly smaller for tighter look
                  fontWeight: '500',
                  marginTop: -1, // Slightly increased gap between emoji and label
                  marginBottom: 2, // Add small bottom margin for breathing room
                  lineHeight: 24, // Tight line height
                  letterSpacing: 0.2, // Space Mono characteristic spacing
                  includeFontPadding: false, // Remove extra font padding on Android
                  fontFamily: fontFamily.mono, // Space Mono font
                  color: isFocused ? theme.primary : theme.foregroundSecondary,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
} 