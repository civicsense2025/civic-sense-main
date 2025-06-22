// Add scenarios to navigation items
import { areScenariosEnabled } from '@/lib/comprehensive-feature-flags'

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Topics' },
  ...(areScenariosEnabled() ? [{ href: '/scenarios', label: 'Scenarios' }] : []),
  { href: '/multiplayer', label: 'Multiplayer' },
  { href: '/civics-test', label: 'Civics Test' },
  { href: '/about', label: 'About' },
] 