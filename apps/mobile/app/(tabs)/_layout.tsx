import { Tabs, useRouter, useSegments } from 'expo-router';
import { useTheme } from '../../lib/theme-context';
import { useAuth } from '../../lib/auth-context';
import { Text } from '../../components/atoms/Text';
import { View, Dimensions, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, maxContentWidth, fontFamily } from '../../lib/theme';
import { CustomBottomTabBar } from '../../components/ui/CustomBottomTabBar';
import { Button } from '../../components/Button';
import useUIStrings from '../../lib/hooks/useUIStrings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate responsive tab bar height
const getTabBarHeight = (bottomInset: number) => {
  const baseHeight = 72;
  const scale = Math.min(SCREEN_WIDTH / 375, 1.5); // Cap at 1.5x
  const calculatedHeight = Math.min(baseHeight * scale, 96); // Cap at 96px
  // Add bottom safe area inset for devices with home indicators
  return calculatedHeight + bottomInset;
};

function TabBarIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const scale = Math.min(SCREEN_WIDTH / 375, 1.2);
  const iconSize = Math.min(20 * scale, 24);
  
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: iconSize,
      height: iconSize,
      marginBottom: -1,
    }}>
      <Text style={{ 
        fontSize: Math.min(16 * scale, 18),
        color: color,
        opacity: focused ? 1 : 0.6,
        fontFamily: fontFamily.mono,
        lineHeight: Math.min(20 * scale, 24),
        includeFontPadding: false,
      }}>
        {name}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = getTabBarHeight(bottom);
  const scale = Math.min(SCREEN_WIDTH / 375, 1.5);
  const router = useRouter();
  const segments = useSegments();
  const { uiStrings } = useUIStrings();

  return (
    <Tabs
      tabBar={(props: any) => (
        <CustomBottomTabBar 
          {...props}
          state={props.state}
          descriptors={props.descriptors}
          navigation={props.navigation}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: fontFamily.mono, // Space Mono for tab labels
          fontSize: 10, // Slightly smaller for tighter look
          fontWeight: '500',
          marginTop: -4, // Bring label much closer to emoji
          marginBottom: 2, // Add small bottom margin for breathing room
          lineHeight: 12, // Tight line height
          letterSpacing: 0.2, // Space Mono characteristic spacing
          includeFontPadding: false, // Remove extra font padding on Android
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: uiStrings.navigation.home,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name="🏠" focused={focused} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="quiz"
        options={{
          title: uiStrings.navigation.learn,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name="🧠" focused={focused} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="saved"
        options={{
          title: uiStrings.navigation.bookmarks,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name="📚" focused={focused} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: uiStrings.navigation.profile,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => <TabBarIcon name="👤" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
} 