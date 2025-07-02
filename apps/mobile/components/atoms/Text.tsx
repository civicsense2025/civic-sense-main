import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { typography, fontFamily, TypographyKey } from '../../lib/theme';

type TextVariant = TypographyKey | 'titleLarge' | 'title' | 'headline' | 'subheadline' | 'body' | 'caption' | 'footnote';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'muted' | 'accent' | 'success' | 'warning' | 'destructive' | 'inherit';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type TextWeight = '300' | '400' | '500' | '600' | '700';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  weight?: TextWeight;
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'text' | 'header';
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'inherit',
  align = 'left',
  weight,
  style,
  numberOfLines,
  ellipsizeMode = 'tail',
  selectable = false,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): TextStyle => {
    return typography[variant] || typography.body;
  };

  const getColorStyles = (): TextStyle => {
    switch (color) {
      case 'primary':
        return { color: theme.primary };
      case 'secondary':
        return { color: theme.foregroundSecondary };
      case 'tertiary':
        return { color: theme.foregroundTertiary };
      case 'muted':
        return { color: theme.mutedForeground };
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

  const textStyles: TextStyle = StyleSheet.flatten([
    styles.base,
    getVariantStyles(),
    getColorStyles(),
    {
      textAlign: align,
      fontWeight: weight || getVariantStyles().fontWeight,
    },
    style,
  ]);

  return (
    <RNText
      style={textStyles}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </RNText>
  );
};

// Pre-configured text variants for common use cases
export const TitleLarge: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="titleLarge" accessibilityRole="header" />
);

export const Title: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="title" accessibilityRole="header" />
);

export const Headline: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="headline" accessibilityRole="header" />
);

export const Subheadline: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="subheadline" />
);

export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="body" />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="caption" />
);

export const Footnote: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="footnote" />
);

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.system,
    includeFontPadding: false, // Android-specific: removes extra padding
    textAlignVertical: 'center', // Android-specific: better alignment
  },
}); 