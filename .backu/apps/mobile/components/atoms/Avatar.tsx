import React, { useState } from 'react';
import { View, Image, ViewStyle, StyleSheet, ImageStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from './Text';
import { borderRadius, spacing, hexToRgba } from '../../lib/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circular' | 'rounded' | 'square';

interface AvatarProps {
  source?: string;
  name?: string;
  initials?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  initials,
  size = 'md',
  variant = 'circular',
  backgroundColor,
  textColor,
  style,
  imageStyle,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  onPress,
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  const getSizeStyles = (): { container: ViewStyle; text: any } => {
    switch (size) {
      case 'xs':
        return {
          container: { width: 24, height: 24 },
          text: { variant: 'footnote' as const, fontSize: 10 },
        };
      case 'sm':
        return {
          container: { width: 32, height: 32 },
          text: { variant: 'footnote' as const, fontSize: 12 },
        };
      case 'lg':
        return {
          container: { width: 64, height: 64 },
          text: { variant: 'headline' as const, fontSize: 20 },
        };
      case 'xl':
        return {
          container: { width: 80, height: 80 },
          text: { variant: 'headline' as const, fontSize: 24 },
        };
      case '2xl':
        return {
          container: { width: 96, height: 96 },
          text: { variant: 'title' as const, fontSize: 28 },
        };
      default: // md
        return {
          container: { width: 48, height: 48 },
          text: { variant: 'body' as const, fontSize: 16 },
        };
    }
  };

  const getVariantStyles = (): ViewStyle => {
    const { container } = getSizeStyles();
    const radius = container.width as number;

    switch (variant) {
      case 'rounded':
        return {
          borderRadius: borderRadius.lg,
        };
      case 'square':
        return {
          borderRadius: borderRadius.sm,
        };
      default: // circular
        return {
          borderRadius: radius / 2,
        };
    }
  };

  const generateInitials = (): string => {
    if (initials) return initials.slice(0, 2).toUpperCase();
    if (name) {
      const words = name.trim().split(' ').filter(word => word.length > 0);
      if (words.length >= 2 && words[0]?.[0] && words[1]?.[0]) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      if (words[0] && words[0].length >= 2) {
        return words[0].slice(0, 2).toUpperCase();
      }
      if (words[0]?.[0]) {
        return words[0][0].toUpperCase();
      }
    }
    return '?';
  };

  const generateBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;
    
    // Generate a consistent color based on the name or initials
    const text = name || initials || '';
    const colors = [
      theme.primary,
      theme.accent,
      theme.success,
      theme.warning,
      theme.destructive,
      hexToRgba(theme.primary, 0.8),
      hexToRgba(theme.accent, 0.8),
      hexToRgba(theme.success, 0.8),
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const selectedColor = colors[Math.abs(hash) % colors.length];
    return selectedColor || theme.primary;
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const bgColor = generateBackgroundColor();
  const finalTextColor = textColor || theme.background;

  const containerStyles: ViewStyle = {
    ...styles.base,
    ...sizeStyles.container,
    ...variantStyles,
    backgroundColor: bgColor,
    ...style,
  };

  const finalImageStyle: ImageStyle = {
    width: sizeStyles.container.width,
    height: sizeStyles.container.height,
    borderRadius: variantStyles.borderRadius,
    ...imageStyle,
  };

  const showImage = source && !imageError;
  const displayInitials = generateInitials();

  return (
    <View
      style={containerStyles}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `Avatar for ${name || 'user'}`}
      accessibilityHint={accessibilityHint}
      accessibilityRole="image"
    >
      {showImage ? (
        <Image
          source={{ uri: source }}
          style={finalImageStyle}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <Text
          variant={sizeStyles.text.variant}
          weight="600"
          style={{
            color: finalTextColor,
            fontSize: sizeStyles.text.fontSize,
          }}
          numberOfLines={1}
        >
          {displayInitials}
        </Text>
      )}
    </View>
  );
};

// Pre-configured avatar variants for common use cases
export const SmallAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar {...props} size="sm" />
);

export const LargeAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar {...props} size="lg" />
);

export const SquareAvatar: React.FC<Omit<AvatarProps, 'variant'>> = (props) => (
  <Avatar {...props} variant="square" />
);

export const RoundedAvatar: React.FC<Omit<AvatarProps, 'variant'>> = (props) => (
  <Avatar {...props} variant="rounded" />
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}); 