import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function WaitingRoom() {
  return (
    <View style={styles.container}>
      <Text>Enhanced Waiting Room</Text>
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