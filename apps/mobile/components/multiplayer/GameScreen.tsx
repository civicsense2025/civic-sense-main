import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useUIStrings from '../../lib/hooks/useUIStrings';

export function GameScreen() {
  const { uiStrings } = useUIStrings() || { uiStrings: { multiplayer: { liveGameScreen: 'Live Game' } } };
  return (
    <View style={styles.container}>
      <Text>{uiStrings.multiplayer.liveGameScreen}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 