import React, { useState } from 'react';
import { TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Surface, SurfaceProps } from '../atoms/Surface';
import { spacing, accessibility, hexToRgba } from '../../lib/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass' | 'multiplayer';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps extends Omit<SurfaceProps, 'variant'> {
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  disabled?: boolean;
  pressable?: boolean;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onPress,
  disabled = false,
  pressable = !!onPress,
  activeOpacity = 0.8,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  ...surfaceProps
}) => {
  const { theme, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          padding: spacing[3],
        };
      case 'lg':
        return {
          padding: spacing[6],
        };
      default:
        return {
          padding: spacing[4],
        };
    }
  };

  const getVariantStyles = (): { surfaceVariant: SurfaceProps['variant']; elevation: SurfaceProps['elevation'] } => {
    switch (variant) {
      case 'elevated':
        return {
          surfaceVariant: 'elevated',
          elevation: (isHovered && pressable) ? 'xl' : 'lg',
        };
      case 'outlined':
        return {
          surfaceVariant: 'outlined',
          elevation: 'none',
        };
      case 'glass':
        return {
          surfaceVariant: 'glass',
          elevation: (isHovered && pressable) ? 'lg' : 'md',
        };
      case 'multiplayer':
        return {
          surfaceVariant: 'elevated',
          elevation: (isHovered && pressable) ? 'lg' : 'md',
        };
      default:
        return {
          surfaceVariant: 'default',
          elevation: (isHovered && pressable) ? 'md' : 'sm',
        };
    }
  };

  const getMultiplayerStyles = (): ViewStyle => {
    if (variant === 'multiplayer') {
      return {
        backgroundColor: (isHovered && pressable) 
          ? theme.multiplayerCardHover 
          : theme.multiplayerCard,
        borderWidth: 1,
        borderColor: theme.multiplayerBorder,
      };
    }
    return {};
  };

  const getHoverStyles = (): ViewStyle => {
    if (!pressable || !isHovered) return {};
    
    // Add subtle hover effects based on variant
    switch (variant) {
      case 'outlined':
        return {
          borderColor: theme.primary,
          backgroundColor: hexToRgba(theme.primary, 0.05),
        };
      case 'glass':
        return {
          backgroundColor: hexToRgba(theme.card, 0.9),
        };
      default:
        return {
          backgroundColor: isDark 
            ? hexToRgba(theme.card, 1.1) 
            : hexToRgba(theme.foreground, 0.02),
        };
    }
  };

  const cardStyles: ViewStyle = {
    ...getSizeStyles(),
    ...getMultiplayerStyles(),
    ...getHoverStyles(),
    minHeight: pressable ? accessibility.minTouchTarget : undefined,
    opacity: disabled ? 0.5 : 1,
    transform: (isPressed && pressable) ? [{ scale: 0.98 }] : [{ scale: 1 }],
    ...style,
  };

  const variantConfig = getVariantStyles();

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && pressable) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  const touchableProps = Platform.OS === 'web' && pressable
    ? {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      } as any
    : {};

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole || 'button'}
        activeOpacity={activeOpacity}
        {...touchableProps}
      >
        <Surface
          variant={variantConfig.surfaceVariant!}
          elevation={variantConfig.elevation!}
          style={cardStyles}
          {...surfaceProps}
        >
          {children}
        </Surface>
      </TouchableOpacity>
    );
  }

  return (
    <Surface
      variant={variantConfig.surfaceVariant!}
      elevation={variantConfig.elevation!}
      style={cardStyles}
      accessible={accessible}
      {...(testID && { testID })}
      {...(accessibilityLabel && { accessibilityLabel })}
      {...(accessibilityRole && { accessibilityRole })}
      {...surfaceProps}
    >
      {children}
    </Surface>
  );
};

// Pre-configured card variants for common use cases
export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="elevated" />
);

export const OutlinedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="outlined" />
);

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="glass" />
);

export const MultiplayerCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="multiplayer" />
);

export const InteractiveCard: React.FC<CardProps> = (props) => (
  <Card {...props} pressable={true} variant="elevated" />
); 