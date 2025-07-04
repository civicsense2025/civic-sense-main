import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from './Text';
import { borderRadius, spacing, hexToRgba } from '../../lib/theme';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  count,
  maxCount = 99,
  showZero = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.secondary,
        };
      case 'success':
        return {
          backgroundColor: theme.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.warning,
        };
      case 'destructive':
        return {
          backgroundColor: theme.destructive,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
        };
      default:
        return {
          backgroundColor: theme.muted,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.foreground;
      case 'secondary':
        return theme.foreground;
      case 'success':
        return theme.foreground;
      case 'warning':
        return theme.warningForeground;
      case 'destructive':
        return theme.foreground;
      case 'outline':
        return theme.foreground;
      default:
        return theme.foreground;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
          minHeight: 18,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          minHeight: 32,
        };
      default: // md
        return {
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1],
          minHeight: 24,
        };
    }
  };

  const getDotStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          width: 8,
          height: 8,
          borderRadius: 4,
        };
      case 'lg':
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
        };
      default: // md
        return {
          width: 12,
          height: 12,
          borderRadius: 6,
        };
    }
  };

  const getTextVariant = () => {
    switch (size) {
      case 'sm':
        return 'footnote' as const;
      case 'lg':
        return 'body' as const;
      default:
        return 'footnote' as const;
    }
  };

  const badgeStyles: ViewStyle = {
    ...styles.base,
    ...getVariantStyles(),
    ...(dot ? getDotStyles() : getSizeStyles()),
    ...style,
  };

  const displayCount = () => {
    if (count === undefined) return null;
    if (count === 0 && !showZero) return null;
    if (count > maxCount) return `${maxCount}+`;
    return count.toString();
  };

  const content = count !== undefined ? displayCount() : children;
  const textColor = getTextColor();

  if (dot) {
    return (
      <View
        style={badgeStyles}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || 'Badge'}
        accessibilityHint={accessibilityHint}
        accessibilityRole="text"
      />
    );
  }

  return (
    <View
      style={badgeStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="text"
    >
      <Text
        variant={getTextVariant()}
        weight="600"
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {content}
      </Text>
    </View>
  );
};

// Pre-configured badge variants for common use cases
export const PrimaryBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="primary" />
);

export const SuccessBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="success" />
);

export const WarningBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="warning" />
);

export const ErrorBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge {...props} variant="destructive" />
);

export const NotificationBadge: React.FC<Omit<BadgeProps, 'variant' | 'size'>> = (props) => (
  <Badge {...props} variant="destructive" size="sm" />
);

export const DotBadge: React.FC<Omit<BadgeProps, 'dot'>> = (props) => (
  <Badge {...props} dot={true} />
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
  },
}); 