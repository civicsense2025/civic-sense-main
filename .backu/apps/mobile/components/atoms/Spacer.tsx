import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing, SpacingKey } from '../../lib/theme';

type SpacerDirection = 'horizontal' | 'vertical' | 'both';

interface SpacerProps {
  size?: SpacingKey | number;
  direction?: SpacerDirection;
  style?: ViewStyle;
  testID?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 4,
  direction = 'vertical',
  style,
  testID,
}) => {
  const getSpacingValue = (sizeValue: SpacingKey | number): number => {
    if (typeof sizeValue === 'number') {
      return sizeValue;
    }
    return spacing[sizeValue] || spacing[4];
  };

  const spacingValue = getSpacingValue(size);

  const getSpacerStyles = (): ViewStyle => {
    switch (direction) {
      case 'horizontal':
        return {
          width: spacingValue,
          height: 0,
        };
      case 'vertical':
        return {
          width: 0,
          height: spacingValue,
        };
      case 'both':
        return {
          width: spacingValue,
          height: spacingValue,
        };
      default:
        return {
          width: 0,
          height: spacingValue,
        };
    }
  };

  return (
    <View
      style={[getSpacerStyles(), style]}
      testID={testID}
      accessible={false}
      importantForAccessibility="no"
    />
  );
};

// Pre-configured spacer variants for common use cases
export const SpacerXS: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="xs" />
);

export const SpacerSM: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="sm" />
);

export const SpacerMD: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="md" />
);

export const SpacerLG: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="lg" />
);

export const SpacerXL: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="xl" />
);

export const Spacer2XL: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="2xl" />
);

export const Spacer3XL: React.FC<Omit<SpacerProps, 'size'>> = (props) => (
  <Spacer {...props} size="3xl" />
);

// Horizontal spacers
export const HorizontalSpacer: React.FC<Omit<SpacerProps, 'direction'>> = (props) => (
  <Spacer {...props} direction="horizontal" />
);

export const VerticalSpacer: React.FC<Omit<SpacerProps, 'direction'>> = (props) => (
  <Spacer {...props} direction="vertical" />
); 