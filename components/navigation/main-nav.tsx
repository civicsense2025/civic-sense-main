import useUIStrings from "@/apps/mobile/lib/hooks/useUIStrings";

// Navigation items - now using UI strings
export function useNavigationItems() {
  const { uiStrings } = useUIStrings();
  
  return [
    { href: '/', label: uiStrings.navigation.home },
    { href: '/categories', label: uiStrings.navigation.topics },
    { href: '/multiplayer', label: 'Multiplayer' },
    { href: '/civics-test', label: 'Civics Test' },
    { href: '/about', label: 'About' },
  ];
} 