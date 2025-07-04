import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';

const civicTokens = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    gold: '#F59E0B',
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
};

interface CivicInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const CivicInput: React.FC<CivicInputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  isRequired = false,
  isDisabled = false,
  isInvalid = false,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const getInputStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.input];
    
    // Add size styles
    if (size === 'sm') {
      baseStyles.push(styles.sm);
    } else if (size === 'lg') {
      baseStyles.push(styles.lg);
    } else {
      baseStyles.push(styles.md);
    }
    
    // Add variant styles
    if (variant === 'filled') {
      baseStyles.push(styles.filled);
    } else if (variant === 'underlined') {
      baseStyles.push(styles.underlined);
    } else {
      baseStyles.push(styles.default);
    }
    
    // Add state styles
    if (isInvalid || error) {
      baseStyles.push(styles.invalid);
    }
    
    if (isDisabled) {
      baseStyles.push(styles.disabled);
    }
    
    // Add icon padding
    if (leftIcon) {
      baseStyles.push(styles.withLeftIcon);
    }
    
    if (rightIcon) {
      baseStyles.push(styles.withRightIcon);
    }
    
    return baseStyles;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {isRequired && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[...getInputStyles(), style]}
          editable={!isDisabled}
          placeholderTextColor={civicTokens.colors.gray[400]}
          {...props}
        />
        
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          <Text style={[
            styles.helperText,
            error ? styles.errorText : styles.normalHelperText
          ]}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: civicTokens.spacing.md,
  } as ViewStyle,
  labelContainer: {
    marginBottom: civicTokens.spacing.xs,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: civicTokens.colors.gray[700],
  } as TextStyle,
  required: {
    color: civicTokens.colors.error,
  } as TextStyle,
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 16,
    color: civicTokens.colors.gray[900],
    backgroundColor: civicTokens.colors.gray[50],
  } as TextStyle,
  // Size variants
  sm: {
    height: 36,
    paddingHorizontal: civicTokens.spacing.sm,
    fontSize: 14,
  } as TextStyle,
  md: {
    height: 44,
    paddingHorizontal: civicTokens.spacing.md,
    fontSize: 16,
  } as TextStyle,
  lg: {
    height: 52,
    paddingHorizontal: civicTokens.spacing.lg,
    fontSize: 18,
  } as TextStyle,
  // Style variants
  default: {
    borderWidth: 1,
    borderColor: civicTokens.colors.gray[300],
    borderRadius: civicTokens.borderRadius.md,
  } as TextStyle,
  filled: {
    backgroundColor: civicTokens.colors.gray[100],
    borderWidth: 0,
    borderRadius: civicTokens.borderRadius.md,
  } as TextStyle,
  underlined: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: civicTokens.colors.gray[300],
    borderRadius: 0,
    paddingHorizontal: 0,
  } as TextStyle,
  // State variants
  invalid: {
    borderColor: civicTokens.colors.error,
  } as TextStyle,
  disabled: {
    backgroundColor: civicTokens.colors.gray[100],
    color: civicTokens.colors.gray[400],
    opacity: 0.6,
  } as TextStyle,
  withLeftIcon: {
    paddingLeft: 40,
  } as TextStyle,
  withRightIcon: {
    paddingRight: 40,
  } as TextStyle,
  // Icon containers
  leftIconContainer: {
    position: 'absolute',
    left: civicTokens.spacing.sm,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  rightIconContainer: {
    position: 'absolute',
    right: civicTokens.spacing.sm,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  // Helper text
  helperContainer: {
    marginTop: civicTokens.spacing.xs,
  } as ViewStyle,
  helperText: {
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  errorText: {
    color: civicTokens.colors.error,
  } as TextStyle,
  normalHelperText: {
    color: civicTokens.colors.gray[500],
  } as TextStyle,
}); 