# CivicSense: Proper Web/Mobile Monorepo Architecture
*Strategic Code Sharing Without Build Conflicts*

## 🚨 Current Problems Analysis

Our investigation revealed fundamental architectural issues:

### Build System Conflicts
- **Next.js** uses Webpack/Turbopack with DOM-specific optimizations
- **Expo** uses Metro bundler with React Native transformations
- **Shared packages** try to compile for both, causing TypeScript errors
- **Import resolution** differs between platforms (`.web.js` vs `.native.js`)

### Dependency Incompatibilities
- **React versions**: Web uses React 19, RN might need React 18
- **UI libraries**: Radix UI (web) vs React Native Elements (mobile)
- **Platform APIs**: `localStorage` vs `AsyncStorage`, `fetch` vs native networking

## 🔄 Current In-Progress Items

### Mobile App Integration
```typescript
// 🔄 Next Implementations Needed
├── apps/mobile/src/lib/
    ├── ui/
    │   ├── ui-strings.ts             # Mobile-specific UI strings
    │   └── translations.service.ts   # Mobile translation handling
    │
    └── platform/
        ├── iap.service.ts           # In-app purchase handling
        ├── notifications.service.ts  # Push notifications
        └── deep-linking.service.ts  # Mobile deep linking

// Next Steps
- [ ] UI & Localization services
- [ ] Platform-specific features (IAP, notifications)
- [ ] React Native navigation setup
- [ ] Mobile testing environment
```

### Build Pipeline Tasks
- [ ] Set up proper build pipeline with Turbo
- [ ] Configure CI/CD for new structure
- [ ] Add build caching and optimization

### Cleanup Tasks
#### Stage 1: Import Migration
- [ ] Migrate auth hooks to @civicsense/business-logic/auth
- [ ] Move platform-specific UI components to respective apps
- [ ] Update toast notifications to platform-specific implementations
- [ ] Fix remaining @civicsense/shared imports
- [ ] Update @civicsense/ui-shared references

#### Stage 2: Package Cleanup
- [ ] Verify no imports from packages/shared remain
- [ ] Verify no imports from packages/ui-shared remain
- [ ] Verify no imports from packages/ui-web in mobile remain
- [ ] Verify no imports from packages/ui-mobile in web remain
- [ ] Remove packages/shared directory
- [ ] Remove packages/ui-shared directory
- [ ] Remove packages/ui-web directory
- [ ] Remove packages/ui-mobile directory

#### Stage 3: Package.json Updates
- [ ] Remove old package references from root package.json
- [ ] Update workspace references
- [ ] Update dependencies in apps/web/package.json
- [ ] Update dependencies in apps/mobile/package.json
- [ ] Remove old package lockfiles

### Platform Independence Tasks
- [ ] Verify apps/web builds without mobile dependencies
- [ ] Verify apps/mobile builds without web dependencies
- [ ] Check for any remaining platform-specific imports
- [ ] Validate no circular dependencies exist

### TypeScript & Linting Tasks
- [ ] Run type-check across all packages
- [ ] Fix any type errors from the migration
- [ ] Update ESLint rules for new package structure
- [ ] Ensure consistent code style across packages

### Final Cleanup Tasks
- [ ] Remove packages/shared directory
- [ ] Remove packages/ui-shared directory
- [ ] Remove packages/ui-web directory
- [ ] Remove packages/ui-mobile directory
- [ ] Update root package.json workspace references
- [ ] Update CI/CD pipeline for new structure

### In-Progress Metrics
- 🔄 100% business logic migrated to packages/business-logic/
- 🔄 100% types migrated to packages/types/
- 🔄 Platform-specific code properly separated
- 🔄 All imports updated to new package structure
- ⏳ Web builds without any mobile dependencies
- ⏳ Mobile builds without any web dependencies  
- ⏳ No TypeScript compilation errors
- ⏳ No import resolution conflicts
- ⏳ 100% business logic shared (auth, quiz, database)
- ⏳ 100% types shared
- ⏳ Fast builds (no cross-platform compilation)
- ⏳ Independent deployment pipelines
- ⏳ Platform-specific optimizations possible

## 🎯 Key Principles

1. **NEVER share UI components** between platforms
2. **ALWAYS share business logic** and data operations  
3. **INJECT platform-specific dependencies** into shared services
4. **USE abstract classes** to define shared behavior with platform-specific implementations
5. **KEEP packages focused** on single responsibilities
6. **AVOID platform-specific imports** in shared packages

## 📦 Completed Migrations Archive

### Package Structure
- ✅ Clean package structure created
- ✅ Design tokens system implemented
- ✅ Business logic foundation ready
- ✅ TypeScript configs properly isolated
- ✅ Auth service architecture defined
- ✅ 100% design tokens shared
- ✅ 0% UI components shared (as intended)
- ✅ Clear separation of concerns

### Core Services
```typescript
// Core Services Completed
├── auth/
│   ├── mobile-auth.service.ts     # ✅ AuthService with SecureStore
│   └── guest-access.service.ts    # ✅ Mobile guest user handling
│
└── storage/
    ├── async-storage.service.ts   # ✅ AsyncStorage implementation
    └── secure-storage.service.ts  # ✅ SecureStore for sensitive data
```

### Business Logic Migrations
```typescript
// Business Logic Migrations (packages/business-logic/src/)
├── quiz/
│   └── quiz-repository.ts          # ✅ Migrated from quiz-database.ts
├── database/
│   └── supabase-client.ts         # ✅ Migrated from database.ts
├── multiplayer/
    ├── index.ts                 # ✅ Created exports file
    ├── multiplayer-service.ts   # ✅ Migrated from multiplayer.ts
    ├── conversation-engine.ts   # ✅ Migrated from multiplayer-conversation-engine.ts
    ├── npc-integration.ts      # ✅ Migrated from multiplayer-npc-integration.ts
    ├── npc-service.ts         # ✅ Migrated from multiplayer-npcs.ts
    ├── enhanced-npc-service.ts # ✅ Migrated from enhanced-npc-service.ts
    ├── game-boosts.ts         # ✅ Migrated from game-boosts.ts
    └── host-manager.ts        # ✅ Migrated from host-privilege-manager.ts
└── services/
    ├── data-service.ts           # ✅ Migrated from data-service.ts
    ├── progress-service.ts       # ✅ Migrated from progress-storage.ts
    ├── skill-service.ts         # ✅ Migrated from skill-operations.ts
    ├── bookmark-service.ts      # ✅ Migrated from bookmarks.ts
    └── premium-service.ts       # ✅ Migrated from premium.ts
```

### Platform-Specific Implementations
```typescript
// Mobile-specific implementations (apps/mobile/src/lib/)
├── mobile/src/lib/
    ├── iap-service.ts          # ✅ Migrated from apple-iap.ts
    ├── ui-strings.ts           # ✅ Created mobile version
    ├── ui-strings-translation.ts # ✅ Created mobile version
    ├── ui-strings-extractor.ts  # ✅ Created mobile version
    ├── guest-tracking.ts       # ✅ Created mobile version
    └── voice-cache.ts          # ✅ Previously migrated

// Web-specific implementations (apps/web/src/lib/)
└── web/src/lib/
    ├── ui-strings.ts           # ✅ Created web version
    ├── ui-strings-translation.ts # ✅ Created web version
    ├── ui-strings-extractor.ts  # ✅ Created web version
    ├── guest-tracking.ts       # ✅ Created web version
    └── keyboard-shortcuts.tsx   # ✅ Previously migrated
```

### Feature Flags & Configuration
```typescript
// Feature Flags & Utils (packages/business-logic/src/utils/)
└── utils/
    ├── index.ts             # ✅ Updated exports file
    ├── feature-flags.ts     # ✅ Migrated from comprehensive-feature-flags.ts
    ├── debug-flags.ts      # ✅ Migrated from debug-feature-flags.ts
    └── statsig-integration.ts # ✅ Migrated from statsig-feature-flags.ts

// Monitoring & Debug
└── utils/
    ├── index.ts          # ✅ Updated exports file
    ├── performance.ts    # ✅ Migrated from performance-monitor.ts
    ├── cache-debug.ts   # ✅ Migrated from cache-debug.ts
    └── debug-config.ts  # ✅ Migrated from debug-config.ts
```

### Integration & Admin Services
```typescript
// Integrations (packages/business-logic/src/integrations/)
├── integrations/
    ├── index.ts           # ✅ Created exports file
    ├── pod-quiz.ts       # ✅ Migrated from pod-quiz-integration.ts
    └── pod-quiz-server.ts # ✅ Migrated from pod-quiz-integration-server.ts

// Admin Services
└── services/
    ├── index.ts          # ✅ Updated exports file
    ├── admin-service.ts  # ✅ Migrated from admin-access.ts
    └── admin-server.ts   # ✅ Migrated from admin-access-server.ts
```

### Content & Data Services
```typescript
// Content Services (packages/business-logic/src/services/)
├── services/
    ├── index.ts           # ✅ Updated exports file
    ├── content-filter.ts  # ✅ Migrated from content-filtering.ts
    ├── card-service.ts   # ✅ Migrated from card-data.ts
    ├── topic-service.ts  # ✅ Migrated from topic-status.ts
    └── content-processor.ts # ✅ Migrated from scheduled-content-processor.ts

// Utils
└── utils/
    ├── index.ts          # ✅ Updated exports file
    └── mock-data.ts     # ✅ Migrated from mock-data.ts
```

### Import Updates
```typescript
// Web App Imports
├── apps/web/
    ├── Database & Types
    │   ├── @civicsense/shared/lib/supabase → @civicsense/business-logic/database ✅
    │   ├── @civicsense/shared/lib/database.types → @civicsense/types/database ✅
    │   └── @civicsense/shared/types/* → @civicsense/types/* ✅
    │
    ├── Services
    │   ├── @civicsense/shared/lib/bookmarks → @civicsense/business-logic/services/bookmark-service ✅
    │   ├── @civicsense/shared/premium → @civicsense/business-logic/services/premium-service ✅
    │   └── @civicsense/shared/data-service → @civicsense/business-logic/services ✅
    │
    ├── Utils & Hooks
    │   ├── @civicsense/shared/cn → @civicsense/business-logic/utils ✅
    │   ├── @civicsense/shared/debug-config → @civicsense/business-logic/utils/debug-config ✅
    │   └── @civicsense/shared/use* → @civicsense/business-logic/hooks/* ✅
    │
    └── Feature Flags
        └── @civicsense/shared/env-feature-flags → @civicsense/business-logic/utils/feature-flags ✅
```

### Types Package Migration
```typescript
// Types Package (packages/types/src/)
├── index.ts           # ✅ Main exports file
├── quiz.ts           # ✅ Quiz types
├── user.ts           # ✅ User types
├── multiplayer.ts    # ✅ Multiplayer types
├── collections.ts    # ✅ Collections types
├── skills.ts        # ✅ Skills types
├── lesson-steps.ts  # ✅ Lesson types
├── incentives.ts    # ✅ Incentives types
├── assessment.ts    # ✅ Assessment types
├── ai.ts           # ✅ AI types
├── integrations.ts # ✅ Integration types
└── env.ts          # ✅ Environment types
```

### Build System Configuration
```typescript
// TypeScript Configuration
├── apps/web/tsconfig.json
│   ├── Extended from tools/typescript-config/next.json ✅
│   ├── Updated module resolution and paths ✅
│   └── Added references to new packages ✅
│
└── apps/mobile/tsconfig.json
    ├── Extended from tools/typescript-config/expo.json ✅
    ├── Updated module resolution and paths ✅
    └── Added references to new packages ✅
```

### Build Scripts
```json
// Root package.json
{
  "scripts": {
    "type-check": "turbo run type-check",
    "type-check:web": "cd apps/web && npm run type-check",
    "type-check:mobile": "cd apps/mobile && npm run type-check",
    "type-check:packages": "turbo run type-check --filter=@civicsense/*"
  }
}