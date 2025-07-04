import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { iOSColors } from '../../lib/theme/ios-colors';

const checkmarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
</svg>`;

const crossmarkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
</svg>`;

interface ResultIconProps {
  isCorrect: boolean;
  size?: number;
  style?: any;
}

export const ResultIcon: React.FC<ResultIconProps> = ({ 
  isCorrect, 
  size = 24,
  style 
}) => {
  const iconColor = isCorrect ? iOSColors.systemGreen : iOSColors.systemRed;
  const iconSvg = isCorrect ? checkmarkSvg : crossmarkSvg;

  return (
    <View style={[styles.container, style]}>
      <SvgXml 
        xml={iconSvg.replace('currentColor', iconColor)}
        width={size} 
        height={size} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 