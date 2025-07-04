import React from 'react';
import { View, ViewStyle, StyleSheet, Dimensions } from 'react-native';
import { maxContentWidth } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContentContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  style,
  fullWidth = false,
}) => {
  return (
    <View style={[styles.container, !fullWidth && styles.maxWidth, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
  maxWidth: {
    maxWidth: maxContentWidth,
    paddingHorizontal: SCREEN_WIDTH > maxContentWidth ? 0 : 16,
  },
}); 