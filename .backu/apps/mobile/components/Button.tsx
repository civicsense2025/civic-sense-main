import React, { useState } from 'react';
import {
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { useTheme } from '../lib/theme-context';
import { Text } from './atoms/Text';
import { Surface } from './atoms/Surface';
import { 
  borderRadius, 
  shadows, 
  spacing, 
  typography, 
  accessibility, 
  hexToRgba 
} from '../lib/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const isInteracting = isHovered || isPressed;
    
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isInteracting 
              ? (isDark ? hexToRgba(theme.primary, 0.8) : hexToRgba(theme.primary, 0.9))
              : theme.primary,
            borderWidth: 0,
            ...shadows.button,
          },
          text: {
            color: theme.foreground,
            fontWeight: '600',
          },
        };

      case 'secondary':
        return {
          container: {
            backgroundColor: isInteracting
              ? (isDark ? hexToRgba(theme.secondary, 1.2) : hexToRgba(theme.secondary, 0.8))
              : theme.secondary,
            borderWidth: 1,
            borderColor: isInteracting 
              ? (isDark ? hexToRgba(theme.border, 1.5) : hexToRgba(theme.border, 0.8))
              : theme.border,
          },
          text: {
            color: theme.foreground,
            fontWeight: '500',
          },
        };

      case 'outlined':
      case 'outline':
        return {
          container: {
            backgroundColor: isInteracting
              ? hexToRgba(theme.primary, 0.1)
              : 'transparent',
            borderWidth: 1,
            borderColor: isInteracting 
              ? theme.primary
              : theme.border,
          },
          text: {
            color: theme.foreground,
            fontWeight: '500',
          },
        };

      case 'ghost':
        return {
          container: {
            backgroundColor: isInteracting
              ? hexToRgba(theme.primary, 0.1)
              : 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.foreground,
            fontWeight: '500',
          },
        };

      case 'destructive':
        return {
          container: {
            backgroundColor: isInteracting
              ? (isDark ? hexToRgba(theme.destructive, 0.8) : hexToRgba(theme.destructive, 0.9))
              : theme.destructive,
            borderWidth: 0,
            ...shadows.button,
          },
          text: {
            color: theme.foreground,
            fontWeight: '600',
          },
        };

      case 'success':
        return {
          container: {
            backgroundColor: isInteracting
              ? (isDark ? hexToRgba(theme.success, 0.8) : hexToRgba(theme.success, 0.9))
              : theme.success,
            borderWidth: 0,
            ...shadows.button,
          },
          text: {
            color: theme.foreground,
            fontWeight: '600',
          },
        };

      default:
        return {
          container: {
            backgroundColor: isInteracting
              ? (isDark ? hexToRgba(theme.primary, 0.8) : hexToRgba(theme.primary, 0.9))
              : theme.primary,
            borderWidth: 0,
            ...shadows.button,
          },
          text: {
            color: theme.foreground,
            fontWeight: '600',
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
      case 'small':
        return {
          container: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            minHeight: 36,
            borderRadius: borderRadius.md,
          },
          text: {
            ...typography.footnote,
          },
        };

      case 'lg':
      case 'large':
        return {
          container: {
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[4],
            minHeight: 52,
            borderRadius: borderRadius.xl,
          },
          text: {
            ...typography.headline,
          },
        };

      case 'xl':
        return {
          container: {
            paddingHorizontal: spacing[8],
            paddingVertical: spacing[5],
            minHeight: 56,
            borderRadius: borderRadius.xl,
          },
          text: {
            ...typography.title,
          },
        };

      case 'medium':
      default: // md
        return {
          container: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            minHeight: accessibility.minTouchTarget, // 44px minimum
            borderRadius: borderRadius.lg,
          },
          text: {
            ...typography.body,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...sizeStyles.container,
    ...variantStyles.container,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
    transform: isPressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
    ...style,
  };

  const textStyles: TextStyle = {
    ...sizeStyles.text,
    ...variantStyles.text,
    textAlign: 'center',
    ...textStyle,
  };

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variantStyles.text.color}
            style={styles.loadingIndicator}
          />
          <Text style={{ ...textStyles, marginLeft: spacing[1] }}>Loading...</Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={styles.contentContainer}>
          {iconPosition === 'left' && (
            <View style={[styles.iconContainer, styles.iconLeft]}>
              {icon}
            </View>
          )}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && (
            <View style={[styles.iconContainer, styles.iconRight]}>
              {icon}
            </View>
          )}
        </View>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  const touchableProps = Platform.OS === 'web' 
    ? {
        // Web-specific hover handlers
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      } as any
    : {};

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      {...touchableProps}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Pre-configured button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const OutlinedButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="outlined" />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="ghost" />
);

export const DestructiveButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="destructive" />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="success" />
);

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: spacing[2],
  },
  loadingText: {
    marginLeft: spacing[1],
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
}); 