import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from './Text';
import { spacing } from '../../lib/theme';

type DividerOrientation = 'horizontal' | 'vertical';
type DividerVariant = 'solid' | 'dashed' | 'dotted';

interface DividerProps {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  thickness?: number;
  color?: string;
  length?: number;
  label?: string;
  spacing?: number;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 1,
  color,
  length,
  label,
  spacing: dividerSpacing = 16,
  style,
  testID,
  accessible = false,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const dividerColor = color || theme.border;

  const getBaseStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: variant === 'solid' ? dividerColor : 'transparent',
    };

    if (orientation === 'horizontal') {
      return {
        ...baseStyle,
        width: length,
        height: thickness,
        borderTopWidth: variant !== 'solid' ? thickness : 0,
        borderTopColor: variant !== 'solid' ? dividerColor : 'transparent',
        borderStyle: variant === 'solid' ? 'solid' : variant,
      };
    } else {
      return {
        ...baseStyle,
        width: thickness,
        height: length,
        borderLeftWidth: variant !== 'solid' ? thickness : 0,
        borderLeftColor: variant !== 'solid' ? dividerColor : 'transparent',
        borderStyle: variant === 'solid' ? 'solid' : variant,
      };
    }
  };

  const dividerStyles: ViewStyle = {
    ...getBaseStyles(),
    ...style,
  };

  if (label && orientation === 'horizontal') {
    return (
      <View
        style={[
          styles.labelContainer,
          { marginVertical: dividerSpacing },
        ]}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || `Divider with label: ${label}`}
        accessibilityRole="text"
      >
        <View style={[dividerStyles, styles.labelDividerLeft]} />
                 <Text
           variant="footnote"
           color="secondary"
           style={{ ...styles.labelText, marginHorizontal: spacing[3] }}
         >
           {label}
         </Text>
        <View style={[dividerStyles, styles.labelDividerRight]} />
      </View>
    );
  }

  const containerStyle: ViewStyle = orientation === 'horizontal'
    ? { marginVertical: dividerSpacing }
    : { marginHorizontal: dividerSpacing };

  return (
    <View
      style={[containerStyle, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || 'Divider'}
      accessibilityRole="none"
    >
      <View style={dividerStyles} />
    </View>
  );
};

// Pre-configured divider variants for common use cases
export const HorizontalDivider: React.FC<Omit<DividerProps, 'orientation'>> = (props) => (
  <Divider {...props} orientation="horizontal" />
);

export const VerticalDivider: React.FC<Omit<DividerProps, 'orientation'>> = (props) => (
  <Divider {...props} orientation="vertical" />
);

export const DashedDivider: React.FC<Omit<DividerProps, 'variant'>> = (props) => (
  <Divider {...props} variant="dashed" />
);

export const DottedDivider: React.FC<Omit<DividerProps, 'variant'>> = (props) => (
  <Divider {...props} variant="dotted" />
);

export const LabeledDivider: React.FC<DividerProps & { label: string }> = (props) => (
  <Divider {...props} />
);

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  labelDividerLeft: {
    flex: 1,
  },
  labelDividerRight: {
    flex: 1,
  },
  labelText: {
    flexShrink: 0,
  },
}); 