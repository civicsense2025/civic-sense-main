import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { borderRadius, shadows, ShadowKey, hexToRgba } from '../../lib/theme';

type SurfaceVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'glass';
type SurfaceElevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type SurfaceRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export interface SurfaceProps {
  children?: React.ReactNode;
  variant?: SurfaceVariant;
  elevation?: SurfaceElevation;
  radius?: SurfaceRadius;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'image' | 'text';
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  variant = 'default',
  elevation = 'none',
  radius = 'lg',
  style,
  testID,
  accessible = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'none',
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.card,
          ...getShadowStyles(),
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'filled':
        return {
          backgroundColor: theme.muted,
        };
      case 'glass':
        return {
          backgroundColor: hexToRgba(theme.card, 0.8),
          borderWidth: 1,
          borderColor: hexToRgba(theme.border, 0.2),
          ...getShadowStyles(),
        };
      default:
        return {
          backgroundColor: theme.card,
        };
    }
  };

  const getShadowStyles = (): ViewStyle => {
    if (elevation === 'none') return {};
    return shadows[elevation as ShadowKey] || shadows.sm;
  };

  const getRadiusStyles = (): ViewStyle => {
    return {
      borderRadius: borderRadius[radius] || borderRadius.lg,
    };
  };

  const surfaceStyles: ViewStyle = {
    ...styles.base,
    ...getVariantStyles(),
    ...getRadiusStyles(),
    ...style,
  };

  return (
    <View
      style={surfaceStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
};

// Pre-configured surface variants for common use cases
export const ElevatedSurface: React.FC<Omit<SurfaceProps, 'variant'>> = (props) => (
  <Surface {...props} variant="elevated" elevation="md" />
);

export const OutlinedSurface: React.FC<Omit<SurfaceProps, 'variant'>> = (props) => (
  <Surface {...props} variant="outlined" />
);

export const FilledSurface: React.FC<Omit<SurfaceProps, 'variant'>> = (props) => (
  <Surface {...props} variant="filled" />
);

export const GlassSurface: React.FC<Omit<SurfaceProps, 'variant'>> = (props) => (
  <Surface {...props} variant="glass" elevation="md" />
);

export const CardSurface: React.FC<Omit<SurfaceProps, 'variant' | 'elevation'>> = (props) => (
  <Surface {...props} variant="elevated" elevation="lg" radius="xl" />
);

export const ModalSurface: React.FC<Omit<SurfaceProps, 'variant' | 'elevation' | 'radius'>> = (props) => (
  <Surface {...props} variant="elevated" elevation="xl" radius="2xl" />
);

const styles = StyleSheet.create({
  base: {
    // Base styles for all surfaces
    overflow: 'hidden', // Ensures content respects border radius
  },
}); 