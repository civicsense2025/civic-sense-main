import React from 'react';
import { View, ViewStyle } from 'react-native';
import { civicTokens } from '../../lib/gluestack-config';
import { shadows } from '../../lib/theme';

interface CivicCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  className?: string;
}

export const CivicCard: React.FC<CivicCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  className = '',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'default':
        return '#FFFFFF';
      case 'elevated':
        return '#FFFFFF';
      case 'outlined':
        return '#FFFFFF';
      case 'ghost':
        return 'transparent';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: '#E5E7EB',
        };
      default:
        return {
          borderWidth: 0,
          borderColor: 'transparent',
        };
    }
  };

  const getShadowStyle = () => {
    switch (variant) {
      case 'elevated':
        return shadows.lg; // Uses theme's large shadow (web-compatible)
      case 'default':
        return shadows.sm; // Uses theme's small shadow (web-compatible)
      default:
        return shadows.none; // No shadow
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: 12 };
      case 'md':
        return { padding: 16 };
      case 'lg':
        return { padding: 24 };
      case 'xl':
        return { padding: 32 };
      default:
        return { padding: 16 };
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: 12,
          ...getBorderStyle(),
          ...getShadowStyle(),
          ...getPaddingStyle(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default CivicCard; 