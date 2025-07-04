import React, { useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { hexToRgba } from '../../lib/theme';

interface CivicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const CivicButton: React.FC<CivicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className = '',
}) => {
  const { theme, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isInteracting = isHovered || isPressed;

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { paddingHorizontal: 12, paddingVertical: 6 };
      case 'sm':
        return { paddingHorizontal: 16, paddingVertical: 8 };
      case 'md':
        return { paddingHorizontal: 24, paddingVertical: 12 };
      case 'lg':
        return { paddingHorizontal: 32, paddingVertical: 16 };
      case 'xl':
        return { paddingHorizontal: 40, paddingVertical: 20 };
      default:
        return { paddingHorizontal: 24, paddingVertical: 12 };
    }
  };

  const getTextStyle = () => {
    const baseStyle = { fontWeight: '600' as const };
    
    switch (variant) {
      case 'primary':
        return { 
          ...baseStyle, 
          color: theme.foreground 
        };
      case 'secondary':
        return { 
          ...baseStyle, 
          color: theme.foreground 
        };
      case 'outline':
        return { 
          ...baseStyle, 
          color: theme.foreground 
        };
      case 'ghost':
        return { 
          ...baseStyle, 
          color: theme.foreground 
        };
      default:
        return { 
          ...baseStyle, 
          color: theme.foreground 
        };
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return isInteracting 
          ? (isDark ? hexToRgba(theme.primary, 0.8) : hexToRgba(theme.primary, 0.9))
          : theme.primary;
      case 'secondary':
        return isInteracting
          ? (isDark ? hexToRgba(theme.secondary, 1.2) : hexToRgba(theme.secondary, 0.8))
          : theme.secondary;
      case 'outline':
        return isInteracting
          ? theme.primary
          : 'transparent';
      case 'ghost':
        return isInteracting
          ? hexToRgba(theme.primary, 0.1)
          : 'transparent';
      default:
        return isInteracting
          ? (isDark ? hexToRgba(theme.primary, 0.8) : hexToRgba(theme.primary, 0.9))
          : theme.primary;
    }
  };

  const getBorderColor = () => {
    return variant === 'outline' 
      ? (isInteracting ? theme.primary : theme.primary)
      : 'transparent';
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

  const touchableProps = Platform.OS === 'web' 
    ? {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      } as any
    : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled || isLoading}
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
        borderWidth: variant === 'outline' ? 2 : 0,
        borderRadius: 8,
        ...getSizeStyles(),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: (isDisabled || isLoading) ? 0.6 : 1,
        minHeight: 44, // iOS minimum touch target
        transform: isPressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
      }}
      activeOpacity={0.8}
      {...touchableProps}
    >
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color={getTextStyle().color} 
          style={{ marginRight: 8 }} 
        />
      )}
      {leftIcon && (
        <View style={{ marginRight: 8 }}>
          {leftIcon}
        </View>
      )}
      <Text style={getTextStyle()}>
        {title}
      </Text>
      {rightIcon && (
        <View style={{ marginLeft: 8 }}>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CivicButton; 