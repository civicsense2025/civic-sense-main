import { Stack } from 'expo-router';

export default function SavedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[itemId]" />
      <Stack.Screen name="custom-quiz/[id]" />
    </Stack>
  );
} 