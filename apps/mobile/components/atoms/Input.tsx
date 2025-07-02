import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../lib/theme-context';
import { Text } from './Text';
import { 
  borderRadius, 
  spacing, 
  typography, 
  accessibility, 
  componentStyles,
  fontFamily 
} from '../../lib/theme';

type InputVariant = 'default' | 'outlined' | 'filled' | 'underlined';
type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'phone' | 'numeric' | 'search';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  variant?: InputVariant;
  size?: InputSize;
  type?: InputType;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  placeholder,
  value,
  onChangeText,
  variant = 'default',
  size = 'md',
  type = 'text',
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  ...textInputProps
}, ref) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getTypeProps = (): Partial<TextInputProps> => {
    switch (type) {
      case 'email':
        return {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoCorrect: false,
          autoComplete: 'email',
        };
      case 'password':
        return {
          secureTextEntry: !isPasswordVisible,
          autoCapitalize: 'none',
          autoCorrect: false,
          autoComplete: 'password',
        };
      case 'phone':
        return {
          keyboardType: 'phone-pad',
          autoComplete: 'tel',
        };
      case 'numeric':
        return {
          keyboardType: 'numeric',
        };
      case 'search':
        return {
          autoCapitalize: 'none',
          autoCorrect: false,
          returnKeyType: 'search',
        };
      default:
        return {};
    }
  };

  const getVariantStyles = (): { container: ViewStyle; input: TextStyle } => {
    const baseContainer: ViewStyle = {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
    };

         const baseInput: TextStyle = {
       ...componentStyles.input,
       fontFamily: fontFamily.system,
       fontSize: typography.body.fontSize,
       lineHeight: typography.body.lineHeight,
       color: theme.foreground,
     };

    switch (variant) {
      case 'outlined':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderColor: error 
              ? theme.destructive 
              : isFocused 
                ? theme.primary 
                : theme.border,
          },
          input: {
            ...baseInput,
            backgroundColor: 'transparent',
          },
        };

      case 'filled':
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.muted,
            borderColor: error 
              ? theme.destructive 
              : isFocused 
                ? theme.primary 
                : 'transparent',
          },
          input: {
            ...baseInput,
            backgroundColor: 'transparent',
          },
        };

      case 'underlined':
        return {
          container: {
            borderRadius: 0,
            borderWidth: 0,
            borderBottomWidth: 2,
            borderBottomColor: error 
              ? theme.destructive 
              : isFocused 
                ? theme.primary 
                : theme.border,
            backgroundColor: 'transparent',
          },
          input: {
            ...baseInput,
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
          },
        };

      default:
        return {
          container: {
            ...baseContainer,
            backgroundColor: theme.input,
            borderColor: error 
              ? theme.destructive 
              : isFocused 
                ? theme.primary 
                : theme.border,
          },
          input: {
            ...baseInput,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; input: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            minHeight: 36,
          },
          input: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            fontSize: typography.sm.fontSize,
          },
        };

      case 'lg':
        return {
          container: {
            minHeight: 52,
          },
          input: {
            paddingHorizontal: spacing[5],
            paddingVertical: spacing[4],
            fontSize: typography.lg.fontSize,
          },
        };

      default: // md
        return {
          container: {
            minHeight: accessibility.minTouchTarget,
          },
          input: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            fontSize: typography.body.fontSize,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyles: ViewStyle = {
    ...variantStyles.container,
    ...sizeStyles.container,
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const textInputStyles: TextStyle = {
    ...variantStyles.input,
    ...sizeStyles.input,
    flex: 1,
    ...inputStyle,
  };

  const renderPasswordToggle = () => {
    if (type !== 'password') return null;

    return (
      <TouchableOpacity
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        style={styles.iconButton}
        testID={`${testID}-password-toggle`}
        accessible={true}
        accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
      >
        <Text variant="body" color="secondary">
          {isPasswordVisible ? '🙈' : '👁️'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRightIcon = () => {
    if (type === 'password') {
      return renderPasswordToggle();
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.iconButton}
          disabled={!onRightIconPress}
          testID={`${testID}-right-icon`}
          accessible={!!onRightIconPress}
          accessibilityRole={onRightIconPress ? 'button' : 'none'}
        >
          {rightIcon}
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={styles.wrapper}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text 
            variant="body" 
            color="inherit" 
            weight="500"
            style={styles.label}
          >
            {label}
            {required && (
              <Text variant="body" color="destructive"> *</Text>
            )}
          </Text>
        </View>
      )}

      {/* Input Container */}
      <View style={[styles.inputContainer, containerStyles]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={ref}
          style={textInputStyles}
          placeholder={placeholder}
          placeholderTextColor={theme.foregroundSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          testID={testID}
          accessible={accessible}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          {...getTypeProps()}
          {...textInputProps}
        />

        {/* Right Icon */}
        {renderRightIcon()}
      </View>

      {/* Helper Text / Error */}
      {(error || helperText) && (
        <View style={styles.helperContainer}>
          <Text 
            variant="footnote" 
            color={error ? 'destructive' : 'secondary'}
            style={styles.helperText}
          >
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

// Pre-configured input variants for common use cases
export const EmailInput = forwardRef<TextInput, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} ref={ref} type="email" />
));

export const PasswordInput = forwardRef<TextInput, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} ref={ref} type="password" />
));

export const PhoneInput = forwardRef<TextInput, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} ref={ref} type="phone" />
));

export const SearchInput = forwardRef<TextInput, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} ref={ref} type="search" />
));

export const NumericInput = forwardRef<TextInput, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} ref={ref} type="numeric" />
));

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing[2],
  },
  label: {
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIconContainer: {
    marginLeft: spacing[3],
    marginRight: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    marginRight: spacing[3],
    marginLeft: spacing[2],
    padding: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: accessibility.minTouchTarget / 2,
    minHeight: accessibility.minTouchTarget / 2,
  },
  helperContainer: {
    marginTop: spacing[1],
  },
  helperText: {
    marginTop: 0,
  },
}); 