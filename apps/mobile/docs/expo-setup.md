# CivicSense Mobile App: Revised Expo Setup Plan
*Proper Web/Mobile Separation with Strategic Code Sharing*

## 🎯 Key Insights from Current Issues

The original plan tried to share too much between Next.js and React Native, causing:
- **Build conflicts**: Next.js and Expo have different build systems
- **Import incompatibilities**: Different module resolution strategies  
- **Platform-specific dependencies**: Web vs Native APIs
- **UI paradigm differences**: DOM vs Native components
- **TypeScript compilation errors**: Mixing web and mobile types
- **Dependency hell**: React Native and Next.js require different versions

## 📁 Revised Monorepo Structure

```
civic-sense-main/
├── apps/
│   ├── web/                           # Next.js app (existing)
│   │   ├── components/                # Web-specific components
│   │   ├── pages/ or app/             # Next.js routing
│   │   ├── lib/                       # Web-specific utilities
│   │   ├── styles/                    # Web CSS/Tailwind
│   │   └── package.json               # Web dependencies
│   └── mobile/                        # Expo app
│       ├── app/                       # Expo Router
│       ├── components/                # Mobile-specific components
│       ├── lib/                       # Mobile-specific utilities
│       ├── assets/                    # Mobile assets
│       └── package.json               # Mobile dependencies
├── packages/
│   ├── core/                          # 🟢 SAFE TO SHARE
│   │   ├── database/                  # Supabase types & queries
│   │   ├── auth/                      # Auth logic (platform-agnostic)
│   │   ├── quiz/                      # Quiz engine & scoring
│   │   ├── multiplayer/               # Game logic
│   │   ├── utils/                     # Pure utility functions
│   │   └── types/                     # TypeScript types
│   ├── ui-primitives/                 # 🟡 CAREFULLY SHARED
│   │   ├── tokens/                    # Design tokens (colors, spacing)
│   │   ├── icons/                     # Icon definitions (not components)
│   │   └── themes/                    # Theme configurations
│   ├── web-ui/                        # 🔴 WEB ONLY
│   │   ├── components/                # React DOM components
│   │   ├── hooks/                     # Web-specific hooks
│   │   └── utils/                     # Web utilities
│   └── mobile-ui/                     # 🔴 MOBILE ONLY
│       ├── components/                # React Native components
│       ├── hooks/                     # Mobile-specific hooks
│       └── utils/                     # Mobile utilities
└── tools/
    ├── eslint-config/                 # Shared linting rules
    ├── typescript-config/             # Shared TS configs
    └── scripts/                       # Build scripts
```

## 🎨 What Can Be Shared vs Platform-Specific

### 🟢 SAFE TO SHARE (packages/core/)
```typescript
// ✅ Database types and queries
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

// ✅ Business logic
export class QuizEngine {
  calculateScore(answers: Answer[]): number {
    // Pure logic, no platform dependencies
  }
}

// ✅ API calls
export async function getQuizQuestions(topicId: string) {
  // Supabase works on both platforms
  return supabase.from('questions').select('*');
}

// ✅ Utility functions
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### 🟡 CAREFULLY SHARED (packages/ui-primitives/)
```typescript
// ✅ Design tokens
export const colors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  // Platform-agnostic color values
};

// ✅ Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ❌ NO COMPONENTS - these must be platform-specific
```

### 🔴 PLATFORM-SPECIFIC

#### Web Only (packages/web-ui/)
```typescript
// Web-specific components using DOM APIs
export function WebQuizComponent() {
  return (
    <div className="bg-blue-500 hover:bg-blue-600">
      {/* DOM elements, CSS classes, web events */}
    </div>
  );
}

// Web-specific hooks
export function useWebNotifications() {
  // Uses Web Notifications API
}
```

#### Mobile Only (packages/mobile-ui/)
```typescript
// Mobile-specific components using React Native
export function MobileQuizComponent() {
  return (
    <View style={{ backgroundColor: colors.primary }}>
      <TouchableOpacity onPress={handlePress}>
        {/* Native components, StyleSheet, touch events */}
      </TouchableOpacity>
    </View>
  );
}

// Mobile-specific hooks
export function usePushNotifications() {
  // Uses Expo Notifications
}
```

## 🏗️ Implementation Strategy

### Phase 1: Clean Separation (Week 1)

#### 1.1 Restructure Packages
```bash
# Move current shared code to core
mkdir -p packages/core
mv packages/shared/src/lib packages/core/
mv packages/shared/src/types packages/core/
mv packages/shared/src/utils packages/core/

# Create platform-specific UI packages
mkdir -p packages/web-ui/src
mkdir -p packages/mobile-ui/src
mkdir -p packages/ui-primitives/src

# Move platform-specific components
mv packages/ui-web/* packages/web-ui/
mv packages/ui-mobile/* packages/mobile-ui/
```

#### 1.2 Update Package Dependencies
```json
// packages/core/package.json
{
  "name": "@civicsense/core",
  "dependencies": {
    "@supabase/supabase-js": "^2.50.0",
    "zod": "^3.24.1"
    // NO React, NO platform-specific deps
  },
  "peerDependencies": {
    // Let consuming apps provide React
  }
}

// packages/web-ui/package.json
{
  "name": "@civicsense/web-ui",
  "dependencies": {
    "@civicsense/core": "workspace:*",
    "@civicsense/ui-primitives": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@radix-ui/react-*": "latest"
    // Web-specific UI libraries
  }
}

// packages/mobile-ui/package.json
{
  "name": "@civicsense/mobile-ui",
  "dependencies": {
    "@civicsense/core": "workspace:*",
    "@civicsense/ui-primitives": "workspace:*",
    "react": "^19.1.0",
    "react-native": "0.79.5"
    // Mobile-specific libraries
  }
}
```

### Phase 2: Core Business Logic (Week 2)

#### 2.1 Platform-Agnostic Auth
```typescript
// packages/core/auth/auth-service.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  constructor(
    private supabase: SupabaseClient,
    private storage: AuthStorage // Injected by platform
  ) {}

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.session) {
      await this.storage.setSession(data.session);
    }
    
    return { data, error };
  }

  async signOut() {
    await this.storage.clearSession();
    return this.supabase.auth.signOut();
  }
}

// Platform-specific storage interface
export interface AuthStorage {
  setSession(session: Session): Promise<void>;
  getSession(): Promise<Session | null>;
  clearSession(): Promise<void>;
}
```

#### 2.2 Web Auth Implementation
```typescript
// packages/web-ui/auth/web-auth-storage.ts
import { AuthStorage } from '@civicsense/core/auth';

export class WebAuthStorage implements AuthStorage {
  async setSession(session: Session): Promise<void> {
    localStorage.setItem('auth-session', JSON.stringify(session));
  }

  async getSession(): Promise<Session | null> {
    const stored = localStorage.getItem('auth-session');
    return stored ? JSON.parse(stored) : null;
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem('auth-session');
  }
}
```

#### 2.3 Mobile Auth Implementation
```typescript
// packages/mobile-ui/auth/mobile-auth-storage.ts
import * as SecureStore from 'expo-secure-store';
import { AuthStorage } from '@civicsense/core/auth';

export class MobileAuthStorage implements AuthStorage {
  async setSession(session: Session): Promise<void> {
    await SecureStore.setItemAsync('auth-session', JSON.stringify(session));
  }

  async getSession(): Promise<Session | null> {
    const stored = await SecureStore.getItemAsync('auth-session');
    return stored ? JSON.parse(stored) : null;
  }

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync('auth-session');
  }
}
```

### Phase 3: UI Abstraction (Week 3)

#### 3.1 Design Tokens
```typescript
// packages/ui-primitives/tokens/colors.ts
export const colors = {
  // Semantic colors
  primary: {
    50: '#EBF4FF',
    500: '#3B82F6',
    900: '#1E3A8A',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

// packages/ui-primitives/tokens/spacing.ts
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// packages/ui-primitives/tokens/typography.ts
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;
```

#### 3.2 Component Interfaces
```typescript
// packages/ui-primitives/interfaces/button.ts
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onPress: () => void;
}

// Shared component logic (no rendering)
export function useButtonLogic(props: ButtonProps) {
  const getButtonStyles = () => {
    return {
      backgroundColor: props.variant === 'primary' ? colors.primary[500] : 'transparent',
      padding: spacing[props.size === 'lg' ? 4 : 3],
      opacity: props.disabled ? 0.5 : 1,
    };
  };

  return { getButtonStyles };
}
```

#### 3.3 Web Button Implementation
```typescript
// packages/web-ui/components/Button.tsx
import { ButtonProps, useButtonLogic } from '@civicsense/ui-primitives/interfaces/button';

export function Button(props: ButtonProps) {
  const { getButtonStyles } = useButtonLogic(props);
  const styles = getButtonStyles();

  return (
    <button
      onClick={props.onPress}
      disabled={props.disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        props.variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90",
        props.variant === 'outline' && "border border-input bg-background hover:bg-accent",
        props.size === 'sm' && "h-9 px-3 text-sm",
        props.size === 'md' && "h-10 px-4 py-2",
        props.size === 'lg' && "h-11 px-8",
        props.disabled && "pointer-events-none opacity-50"
      )}
    >
      {props.children}
    </button>
  );
}
```

#### 3.4 Mobile Button Implementation
```typescript
// packages/mobile-ui/components/Button.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ButtonProps, useButtonLogic } from '@civicsense/ui-primitives/interfaces/button';
import { colors, spacing, typography } from '@civicsense/ui-primitives/tokens';

export function Button(props: ButtonProps) {
  const { getButtonStyles } = useButtonLogic(props);
  const baseStyles = getButtonStyles();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[props.variant || 'primary'],
        styles[props.size || 'md'],
        { opacity: props.disabled ? 0.5 : 1 },
      ]}
      onPress={props.onPress}
      disabled={props.disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, styles[`${props.variant || 'primary'}Text`]]}>
        {props.children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  lg: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  text: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: colors.primary[500],
  },
});
```

### Phase 4: App-Specific Implementation (Week 4)

#### 4.1 Web App Structure
```typescript
// apps/web/lib/auth.ts
import { AuthService, createSupabaseClient } from '@civicsense/core/auth';
import { WebAuthStorage } from '@civicsense/web-ui/auth';

export const authService = new AuthService(
  createSupabaseClient(),
  new WebAuthStorage()
);

// apps/web/components/QuizPage.tsx
import { QuizEngine } from '@civicsense/core/quiz';
import { Button } from '@civicsense/web-ui/components/Button';

export function QuizPage() {
  return (
    <div className="container mx-auto">
      <Button variant="primary" onPress={() => console.log('Start Quiz')}>
        Start Quiz
      </Button>
    </div>
  );
}
```

#### 4.2 Mobile App Structure
```typescript
// apps/mobile/lib/auth.ts
import { AuthService, createSupabaseClient } from '@civicsense/core/auth';
import { MobileAuthStorage } from '@civicsense/mobile-ui/auth';

export const authService = new AuthService(
  createSupabaseClient(),
  new MobileAuthStorage()
);

// apps/mobile/app/quiz.tsx
import { View } from 'react-native';
import { QuizEngine } from '@civicsense/core/quiz';
import { Button } from '@civicsense/mobile-ui/components/Button';

export default function QuizScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button variant="primary" onPress={() => console.log('Start Quiz')}>
        Start Quiz
      </Button>
    </View>
  );
}
```

## 🔧 Build Configuration

### 4.3 Independent Build Systems
```json
// apps/web/package.json
{
  "dependencies": {
    "@civicsense/core": "workspace:*",
    "@civicsense/web-ui": "workspace:*",
    "@civicsense/ui-primitives": "workspace:*",
    "next": "^15.1.3"
    // NO mobile-specific deps
  }
}

// apps/mobile/package.json
{
  "dependencies": {
    "@civicsense/core": "workspace:*",
    "@civicsense/mobile-ui": "workspace:*",
    "@civicsense/ui-primitives": "workspace:*",
    "expo": "~53.0.0"
    // NO web-specific deps
  }
}
```

### 4.4 TypeScript Configuration
```json
// packages/core/tsconfig.json
{
  "extends": "../../tools/typescript-config/base.json",
  "compilerOptions": {
    "lib": ["ES2020"], // No DOM, no React Native
    "types": []
  }
}

// packages/web-ui/tsconfig.json
{
  "extends": "../../tools/typescript-config/react.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "react-jsx"
  }
}

// packages/mobile-ui/tsconfig.json
{
  "extends": "../../tools/typescript-config/react-native.json",
  "compilerOptions": {
    "lib": ["ES2020"],
    "jsx": "react-jsx",
    "types": ["react-native"]
  }
}
```

## 📊 Migration Strategy

### Week 1: Foundation
- [ ] Restructure packages according to new architecture
- [ ] Update package.json dependencies
- [ ] Create build isolation

### Week 2: Core Logic
- [ ] Move business logic to `packages/core`
- [ ] Implement platform-agnostic services
- [ ] Create storage abstractions

### Week 3: UI System
- [ ] Extract design tokens
- [ ] Create component interfaces
- [ ] Implement platform-specific components

### Week 4: Integration
- [ ] Update web app to use new packages
- [ ] Update mobile app to use new packages
- [ ] Test both platforms independently

## ✅ Success Criteria

### Build Independence
- ✅ Web app builds without mobile dependencies
- ✅ Mobile app builds without web dependencies
- ✅ Core packages have no platform dependencies

### Code Sharing Efficiency
- ✅ Business logic shared 100%
- ✅ Design tokens shared 100%
- ✅ UI components 0% shared (platform-specific)
- ✅ No build conflicts or import errors

### Developer Experience
- ✅ Fast builds for each platform
- ✅ Clear separation of concerns
- ✅ Type safety across all packages
- ✅ Independent deployment pipelines

## 🚨 Key Principles

1. **Never share UI components** between web and mobile
2. **Always share business logic** and data models
3. **Inject platform-specific dependencies** into core services
4. **Use interfaces** to define contracts between layers
5. **Keep packages focused** on single responsibilities

This revised approach eliminates the build conflicts while maximizing appropriate code sharing. Each platform can evolve independently while sharing the core business logic that makes CivicSense unique.