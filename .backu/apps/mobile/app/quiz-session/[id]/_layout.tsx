import { Stack } from 'expo-router';

export default function QuizSessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Quiz Session',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="play" 
        options={{
          title: 'Starting Quiz',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="summary" 
        options={{
          title: 'Quiz Results',
          headerShown: false,
        }} 
      />
    </Stack>
  );
} 