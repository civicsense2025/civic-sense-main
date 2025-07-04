import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../atoms/Text';
import { Avatar } from '../atoms/Avatar';
import { spacing, fontFamily, borderRadius, typography, responsive } from '../../lib/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * AppHeader - Clean, Apple-inspired header component
 * 
 * Features:
 * - Avatar positioned on the right side (iOS pattern)
 * - Clean, minimal design following Apple HIG
 * - Optional date navigation for home screen
 * - Automatically hidden on home screen unless explicitly shown
 * - Responsive typography and spacing
 * - Proper safe area handling
 * 
 * Usage:
 * ```tsx
 * <AppHeader 
 *   title="Quiz Center"
 *   subtitle="Test your civic knowledge"
 *   showAvatar={true}
 *   showOnHome={false}
 *   // Date navigation props
 *   showDateNavigation={true}
 *   selectedDate={new Date()}
 *   onDateChange={(date) => setDate(date)}
 * />
 * ```
 */

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  showOnHome?: boolean;
  transparent?: boolean;
  onAvatarPress?: () => void;
  rightComponent?: React.ReactElement;
  // Date navigation props
  showDateNavigation?: boolean;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onTodayPress?: () => void; // Tap current date to jump to today
  maxPastDays?: number;
  maxFutureDays?: number;
}

// Utility functions for date handling
const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0]!;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateKey(date1) === formatDateKey(date2);
};

const formatDateForNav = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  
  // Return compact MM/DD format for all other dates
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric'
  });
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showAvatar = true,
  showOnHome = false,
  transparent = false,
  onAvatarPress,
  rightComponent,
  showDateNavigation = false,
  selectedDate,
  onDateChange,
  onTodayPress,
  maxPastDays = 30,
  maxFutureDays = 7, // Show future dates for visual balance
}) => {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Don't show on home screen unless explicitly requested
  const isHomePage = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname?.includes('/(tabs)');
  if (!showOnHome && isHomePage) {
    return null;
  }

  const handleAvatarPress = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  const getUserInitials = (): string => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ').filter(name => name.length > 0);
      if (names.length >= 2) {
        const firstName = names[0];
        const lastName = names[1];
        if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
          const firstInitial = firstName[0];
          const lastInitial = lastName[0];
          if (firstInitial && lastInitial) {
            return firstInitial + lastInitial;
          }
        }
      }
      if (names.length > 0 && names[0] && names[0].length > 0) {
        const firstChar = names[0]![0];
        if (firstChar) {
          return firstChar;
        }
      }
    }
    const emailInitial = user?.email?.[0];
    return emailInitial || 'U';
  };

  // Date navigation logic - Improved for better content alignment
  const generateDateOptions = () => {
    if (!selectedDate) return [];
    
    const options = [];
    const today = new Date();
    
    // Add past dates (content is more likely to exist for past dates)
    for (let i = maxPastDays; i > 0; i--) {
      options.push(addDays(today, -i));
    }
    
    // Add today
    options.push(today);
    
    // Only add a few future dates for visual balance (most content won't exist for future dates)
    for (let i = 1; i <= Math.min(maxFutureDays, 3); i++) {
      options.push(addDays(today, i));
    }
    
    return options;
  };

  const dateOptions = generateDateOptions();
  const currentIndex = selectedDate ? dateOptions.findIndex(date => isSameDay(date, selectedDate)) : -1;
  const canGoPrevious = currentIndex > 0;
  
  // Allow showing next date for visual balance, but disable navigation to future dates
  const canGoNext = currentIndex < dateOptions.length - 1;
  const nextDate = canGoNext ? dateOptions[currentIndex + 1] : null;
  const today = new Date();
  const isNextDateNavigable = nextDate ? nextDate <= today : false;

  const handlePreviousDate = () => {
    if (canGoPrevious && onDateChange && currentIndex > 0) {
      const prevDate = dateOptions[currentIndex - 1];
      if (prevDate) {
        console.log(`📅 AppHeader: Navigating to previous date: ${formatDateKey(prevDate)}`);
        onDateChange(prevDate);
      }
    }
  };

  const handleNextDate = () => {
    if (canGoNext && onDateChange && isNextDateNavigable) {
      const nextDate = dateOptions[currentIndex + 1];
      if (nextDate) {
        console.log(`📅 AppHeader: Navigating to next date: ${formatDateKey(nextDate)}`);
        onDateChange(nextDate);
      }
    }
    // Note: Future dates are shown for visual balance but navigation is disabled
  };

  const styles = StyleSheet.create({
    header: {
      backgroundColor: transparent ? 'transparent' : theme.background,
      borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      paddingTop: insets?.top || 0,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing?.lg || 20,
      paddingVertical: spacing?.sm || 12,
      minHeight: 44, // iOS minimum touch target
    },
    titleContainer: {
      flex: 1,
      alignItems: 'flex-start',
    },
    title: {
      fontSize: (responsive?.getFontSize ? responsive.getFontSize({
        mobile: typography?.title1?.fontSize || 28,
        small: typography?.title?.fontSize || 24,
        medium: typography?.titleLarge?.fontSize || 32,
        default: typography?.title?.fontSize || 24,
      }) : undefined) || 24,
      fontWeight: '700',
      color: theme.foreground,
      fontFamily: fontFamily?.display || 'System',
      lineHeight: responsive?.getFontSize?.({
        mobile: typography?.title1?.lineHeight || 34,
        small: typography?.title?.lineHeight || 29,
        medium: typography?.titleLarge?.lineHeight || 39,
        default: typography?.title?.lineHeight || 29,
      }) || 29,
      letterSpacing: -0.02,
    },
    subtitle: {
      fontSize: responsive?.getFontSize?.({
        mobile: typography?.subheadline?.fontSize || 15,
        small: typography?.headline?.fontSize || 17,
        medium: typography?.headline?.fontSize || 17,
        default: typography?.subheadline?.fontSize || 15,
      }) || 15,
      fontWeight: '400',
      color: theme.foregroundSecondary,
      fontFamily: fontFamily?.text || 'System',
      lineHeight: responsive?.getFontSize?.({
        mobile: typography?.subheadline?.lineHeight || 20,
        small: typography?.headline?.lineHeight || 22,
        medium: typography?.headline?.lineHeight || 22,
        default: typography?.subheadline?.lineHeight || 20,
      }) || 20,
      marginTop: 2,
    },
    avatarContainer: {
      marginLeft: spacing?.md || 16,
    },
    avatarButton: {
      borderRadius: borderRadius?.full || 50,
      overflow: 'hidden',
    },
    
    // Date Navigation Styles (Full Width - replaces title/subtitle)
    dateNavigationInline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      paddingRight: spacing?.md || 16,
    },
    dateNavigationFullWidth: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      paddingHorizontal: spacing?.md || 16, // Add horizontal padding for balance
    },
    titleSectionWithAvatar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
    },
    dateButton: {
      padding: spacing?.xs || 8,
      borderRadius: borderRadius?.sm || 8,
      minWidth: 36,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateButtonDisabled: {
      opacity: 0.3,
    },
    currentDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
      paddingHorizontal: spacing?.md || 16,
    },
    mainDateContainer: {
      alignItems: 'center',
      flex: 1.5, // Give center more space for better balance
      marginTop: spacing?.xs || 8,
    },
    dateTextLarge: {
      fontSize: typography?.title2?.fontSize || 22,
      fontWeight: '700',
      color: theme.foreground,
      fontFamily: 'SpaceMono-Bold',
      letterSpacing: -0.02,
      lineHeight: (typography?.title2?.fontSize || 22) * 1.3,
      includeFontPadding: false,
    },
    todayTextLarge: {
      fontSize: typography?.title2?.fontSize || 22,
      fontWeight: '700',
      color: theme.primary,
      fontFamily: 'SpaceMono-Bold',
      letterSpacing: -0.02,
      lineHeight: (typography?.title2?.fontSize || 22) * 1.3,
      includeFontPadding: false,
    },
    dateTextSmall: {
      fontSize: typography?.callout?.fontSize || 16,
      fontWeight: '500',
      color: theme.foregroundSecondary,
      fontFamily: 'SpaceMono-Regular',
      letterSpacing: -0.5,
      lineHeight: (typography?.callout?.fontSize || 16) * 1.3,
      includeFontPadding: false,
    },
    dateTextEdge: {
      fontSize: typography?.subheadline?.fontSize || 15,
      fontWeight: '600',
      color: theme.foregroundSecondary,
      fontFamily: 'SpaceMono-Regular',
      letterSpacing: -0.5,
      minWidth: 50, // Reduced for compact date format
      lineHeight: (typography?.subheadline?.fontSize || 15) * 1.3,
      includeFontPadding: false,
    },
    dateSubtitle: {
      fontSize: typography?.footnote?.fontSize || 13,
      fontWeight: '400',
      fontFamily: fontFamily?.text || 'System',
      marginTop: 2,
      textAlign: 'center',
      lineHeight: (typography?.footnote?.fontSize || 13) * 1.4,
      includeFontPadding: false,
    },
    // Legacy styles (kept for backward compatibility)
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing?.lg || 20,
      paddingVertical: spacing?.sm || 12,
      gap: spacing?.lg || 20,
    },
    dateText: {
      fontSize: typography?.callout?.fontSize || 16,
      fontWeight: '500',
      color: theme.foreground,
      fontFamily: fontFamily?.text || 'System',
    },
    todayText: {
      fontSize: typography?.callout?.fontSize || 16,
      fontWeight: '600',
      color: theme.primary,
      fontFamily: fontFamily?.text || 'System',
    },
    dateSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // Center content within each section
      padding: spacing?.sm || 12, // Increased padding for better touch target
      flex: 1, // Equal flex for both sides
      minHeight: 44, // Ensure consistent touch target height
    },
    previousDateSection: {
      justifyContent: 'flex-start', // Align left content to start
    },
    nextDateSection: {
      justifyContent: 'flex-end', // Align right content to end
    },
    dateSectionDisabled: {
      opacity: 0.3,
    },
    datePreviewText: {
      fontSize: typography?.subheadline?.fontSize || 15, // Increased from callout for better visibility
      fontWeight: '600', // Increased weight for better visibility
      color: theme.foreground, // Use primary foreground for better contrast
      fontFamily: 'SpaceMono-Regular',
      lineHeight: (typography?.subheadline?.fontSize || 15) * 1.3,
      includeFontPadding: false,
      textAlign: 'center',
      minWidth: 45, // Reduced for compact date format like "6/12"
    },
  });

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={transparent ? 'transparent' : theme.background}
        translucent={transparent}
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Date Navigation OR Title Section */}
          {showDateNavigation && selectedDate && onDateChange ? (
            // Date Navigation replaces title/subtitle and stretches full width
            <View style={styles.dateNavigationFullWidth}>
              {/* Previous Date Section - Full tappable area */}
              <TouchableOpacity
                onPress={handlePreviousDate}
                disabled={!canGoPrevious}
                style={[
                  styles.dateSection,
                  styles.previousDateSection,
                  !canGoPrevious && styles.dateSectionDisabled,
                ]}
                accessibilityLabel={`Previous day: ${canGoPrevious && currentIndex > 0 && dateOptions[currentIndex - 1] ? formatDateForNav(dateOptions[currentIndex - 1]!) : 'None'}`}
                accessibilityRole="button"
                activeOpacity={0.6}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={18} 
                  color={canGoPrevious ? theme.foregroundSecondary : theme.foregroundTertiary} 
                />
                {(() => {
                  const prevDate = canGoPrevious && currentIndex > 0 ? dateOptions[currentIndex - 1] : null;
                  return prevDate ? (
                    <Text style={[styles.datePreviewText, { color: canGoPrevious ? theme.foregroundSecondary : theme.foregroundTertiary }]}>
                      {formatDateForNav(prevDate)}
                    </Text>
                  ) : (
                    <Text style={[styles.datePreviewText, { opacity: 0 }]}>
                      {' '}
                    </Text>
                  );
                })()}
              </TouchableOpacity>

              {/* Current Date Display - Center (Tappable to return to today) */}
              {selectedDate && (
                <TouchableOpacity 
                  style={styles.mainDateContainer}
                  onPress={() => {
                    if (onTodayPress && !isToday(selectedDate)) {
                      onTodayPress();
                    }
                  }}
                  activeOpacity={!isToday(selectedDate) ? 0.6 : 1.0}
                  disabled={isToday(selectedDate)}
                  accessibilityLabel={isToday(selectedDate) ? "Today's date" : "Tap to return to today"}
                  accessibilityRole="button"
                >
                  <Text style={isToday(selectedDate) ? styles.todayTextLarge : styles.dateTextLarge}>
                    {formatDateForNav(selectedDate)}
                  </Text>
                  {subtitle && (
                    <Text style={[styles.dateSubtitle, { color: theme.foregroundSecondary }]}>
                      {subtitle}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Next Date Section - Full tappable area */}
              <TouchableOpacity
                onPress={handleNextDate}
                disabled={!isNextDateNavigable}
                style={[
                  styles.dateSection,
                  styles.nextDateSection,
                  !isNextDateNavigable && styles.dateSectionDisabled,
                ]}
                accessibilityLabel={`Next day: ${canGoNext && currentIndex < dateOptions.length - 1 && dateOptions[currentIndex + 1] ? formatDateForNav(dateOptions[currentIndex + 1]!) : 'None'}`}
                accessibilityRole="button"
                activeOpacity={0.6}
              >
                {(() => {
                  const nextDate = canGoNext && currentIndex < dateOptions.length - 1 ? dateOptions[currentIndex + 1] : null;
                  return nextDate ? (
                    <Text style={[styles.datePreviewText, { color: isNextDateNavigable ? theme.foregroundSecondary : theme.foregroundTertiary }]}>
                      {formatDateForNav(nextDate)}
                    </Text>
                  ) : (
                    <Text style={[styles.datePreviewText, { opacity: 0 }]}>
                      {' '}
                    </Text>
                  );
                })()}
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color={isNextDateNavigable ? theme.foregroundSecondary : theme.foregroundTertiary} 
                />
              </TouchableOpacity>
            </View>
          ) : (
            // Regular Title Section (when date navigation is not shown)
            <View style={styles.titleSectionWithAvatar}>
              {(title || subtitle) && (
                <View style={styles.titleContainer}>
                  {title && (
                    <Text style={styles.title} numberOfLines={1}>
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              )}

              {/* Right Component or Avatar Section */}
              {rightComponent ? (
                <View style={styles.avatarContainer}>
                  {rightComponent}
                </View>
              ) : showAvatar && user ? (
                <View style={styles.avatarContainer}>
                  <TouchableOpacity
                    style={styles.avatarButton}
                    onPress={handleAvatarPress}
                    activeOpacity={0.8}
                    accessibilityLabel="Open profile"
                    accessibilityHint="Navigate to your profile page"
                  >
                    <Avatar
                      initials={getUserInitials()}
                      size="md"
                      variant="circular"
                    />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </>
  );
};

// Pre-configured variants for common use cases
export const AppHeaderWithTitle: React.FC<Omit<AppHeaderProps, 'title'> & { title: string }> = (props) => (
  <AppHeader {...props} />
);

export const TransparentAppHeader: React.FC<Omit<AppHeaderProps, 'transparent'>> = (props) => (
  <AppHeader {...props} transparent />
);

export const SimpleAppHeader: React.FC<Omit<AppHeaderProps, 'showAvatar' | 'title' | 'subtitle'>> = (props) => (
  <AppHeader {...props} title="CivicSense" showAvatar={false} />
); 