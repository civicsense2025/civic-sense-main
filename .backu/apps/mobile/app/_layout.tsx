import { Stack } from 'expo-router';
import { View } from 'react-native';
import { debugStartup } from '../lib/debug/startup-debug';

// Run debug on startup
debugStartup();

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
} 