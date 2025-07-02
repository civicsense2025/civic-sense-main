import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from './Text';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type IconColor = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'warning' | 'destructive' | 'inherit';

interface IconProps {
  name: string; // Emoji or icon character
  size?: IconSize;
  color?: IconColor;
  customColor?: string;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'inherit',
  customColor,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          fontSize: 12,
          width: 16,
          height: 16,
        };
      case 'sm':
        return {
          fontSize: 16,
          width: 20,
          height: 20,
        };
      case 'lg':
        return {
          fontSize: 24,
          width: 32,
          height: 32,
        };
      case 'xl':
        return {
          fontSize: 32,
          width: 40,
          height: 40,
        };
      case '2xl':
        return {
          fontSize: 40,
          width: 48,
          height: 48,
        };
      default: // md
        return {
          fontSize: 20,
          width: 24,
          height: 24,
        };
    }
  };

  const getColorStyles = () => {
    if (customColor) return { color: customColor };
    
    switch (color) {
      case 'primary':
        return { color: theme.primary };
      case 'secondary':
        return { color: theme.foregroundSecondary };
      case 'tertiary':
        return { color: theme.foregroundTertiary };
      case 'accent':
        return { color: theme.accent };
      case 'success':
        return { color: theme.success };
      case 'warning':
        return { color: theme.warning };
      case 'destructive':
        return { color: theme.destructive };
      case 'inherit':
      default:
        return { color: theme.foreground };
    }
  };

  const sizeStyles = getSizeStyles();
  const colorStyles = getColorStyles();

  const iconStyles = {
    ...styles.base,
    ...sizeStyles,
    ...colorStyles,
    ...style,
  };

  return (
    <View
      style={[styles.container, { width: sizeStyles.width, height: sizeStyles.height }]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${name} icon`}
      accessibilityHint={accessibilityHint}
      accessibilityRole="image"
    >
      <Text
        style={iconStyles}
        numberOfLines={1}
        accessible={false}
      >
        {name}
      </Text>
    </View>
  );
};

// Pre-configured icon variants for common use cases
export const SmallIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="sm" />
);

export const LargeIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="lg" />
);

export const PrimaryIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="primary" />
);

export const SuccessIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="success" />
);

export const WarningIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="warning" />
);

export const ErrorIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="destructive" />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  base: {
    textAlign: 'center',
    lineHeight: undefined, // Let the system handle line height for emojis
  },
}); 