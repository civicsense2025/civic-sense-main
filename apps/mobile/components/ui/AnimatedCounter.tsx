import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
import { useTheme } from '../../lib/theme-context';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  suffix?: string;
  prefix?: string;
  formatter?: (value: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  suffix = '',
  prefix = '',
  formatter,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: animatedVal }) => {
      setDisplayValue(Math.round(animatedVal));
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, duration]);

  const formatValue = (val: number) => {
    if (formatter) {
      return formatter(val);
    }
    return val.toString();
  };

  return (
    <Text
      style={[
        {
          color: theme.foreground,
          fontSize: 24,
          fontWeight: 'bold',
        },
        style,
      ]}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </Text>
  );
}; 