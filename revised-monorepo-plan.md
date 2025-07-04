# CivicSense Monorepo TypeScript Error Resolution Plan

## Overview
After setting up the monorepo structure, we've identified 200+ TypeScript errors across the `@civicsense/business-logic` package that need systematic resolution. This plan prioritizes fixes by impact and dependency order.

## Error Summary by Category

### 🚨 Critical Foundation (Fix First)
- **Database & Auth**: 8 errors across core database and authentication services
- **Feature Flags**: 6 errors in feature flag system (affects everything)
- **Types/Constants**: 16 errors in foundational utility files

### 🔧 Core Services (Fix Second) 
- **Quiz System**: 58 errors across quiz functionality (core app feature)
- **Data Services**: 35 errors in data layer services
- **Content Services**: 25 errors in content filtering and processing

### 🎮 Advanced Features (Fix Third)
- **Multiplayer**: 77 errors across multiplayer/gamification system
- **AI Services**: 32 errors in AI-powered features
- **Integrations**: 12 errors in external integrations

### 🌐 Localization (Fix Last)
- **Translations**: 2549 errors (mostly in `en.ts` - likely structural issue)

## Systematic Fix Strategy

### Phase 1: Foundation Fixes (Priority 1) ⚡
**Target: Complete within 2-3 hours**

#### 1.1 Type Imports & Exports (30 min)
```bash
# Files to fix first:
- src/utils/constants.ts (12 errors)
- src/feature-flags.ts (4 errors) 
- src/database/supabase-client.ts (6 errors)
- src/auth/auth-service.ts (6 errors)
```
**Common issues likely:**
- Missing type imports from `@civicsense/types`
- Incorrect import paths after monorepo restructure
- Missing exported types

**Fix approach:**
```typescript
// Before (broken import)
import { User } from '../types/user'

// After (monorepo import)
import { User } from '@civicsense/types'
```

#### 1.2 Database Configuration (30 min)
```bash
# Focus on:
- src/database/supabase-client.ts (6 errors)
```
**Likely issues:**
- Environment variable types
- Supabase client configuration
- Database type definitions

#### 1.3 Feature Flags System (45 min)
```bash
# Critical for conditional features:
- src/feature-flags.ts (4 errors)
- src/utils/feature-flags.ts (2 errors)
- src/utils/statsig-integration.ts (1 error)
```

### Phase 2: Core Service Layer (Priority 2) 🔧
**Target: Complete within 4-5 hours**

#### 2.1 Data Services (2 hours)
```bash
# Core data layer:
- src/services/data-service.ts (13 errors)
- src/services/content-filter.ts (152 errors) ⚠️ Major issue
- src/services/progress-service.ts (3 errors)
- src/services/bookmark-service.ts (8 errors)
- src/services/premium-service.ts (4 errors)
```

#### 2.2 Quiz System (2 hours)
```bash
# Core app functionality:
- src/quiz/quiz-repository.ts (5 errors)
- src/quiz/progress-demo.ts (22 errors)
- src/quiz/save-manager.ts (14 errors) 
- src/quiz/stats-service.ts (6 errors)
- src/quiz/config.ts (1 error)
```

#### 2.3 Content Processing (1 hour)
```bash
# Content-related services:
- src/services/topic-service.ts (1 error)
- src/services/skill-service.ts (2 errors)
- src/services/card-service.ts (estimated from imports)
```

### Phase 3: Advanced Features (Priority 3) 🎮
**Target: Complete within 6-8 hours**

#### 3.1 AI Services (2 hours)
```bash
# AI-powered features:
- src/ai/bias-analyzer.ts (2 errors)
- src/ai/deck-builder.ts (1 error)
- src/ai/image-service.ts (1 error)
- src/ai/pattern-service.ts (5 errors)
- src/ai/quiz-generator.ts (1 error)
```

#### 3.2 Multiplayer System (4-6 hours)
```bash
# Complex multiplayer features:
- src/multiplayer/enhanced-npc-service.ts (21 errors) ⚠️ Major
- src/multiplayer/npc-service.ts (25 errors) ⚠️ Major  
- src/multiplayer/host-manager.ts (12 errors)
- src/multiplayer/multiplayer-service.ts (3 errors)
- src/multiplayer/gamification-engine.ts (6 errors)
- src/multiplayer/conversation-engine.ts (5 errors)
- src/multiplayer/npc-integration.ts (3 errors)
```

#### 3.3 External Integrations (1 hour)
```bash
# Third-party integrations:
- src/integrations/pod-quiz.ts (10 errors)
- src/integrations/pod-quiz-server.ts (2 errors)
```

### Phase 4: Localization & UI (Priority 4) 🌐
**Target: Complete within 2-4 hours**

#### 4.1 Translation System Investigation (1 hour)
```bash
# Major structural issue:
- src/strings/translations/en.ts (2533 errors) ⚠️ CRITICAL
```
**Likely causes:**
- Malformed JSON/object structure
- Missing type definitions
- Circular import dependencies
- Encoding issues

#### 4.2 Translation Files Cleanup (2-3 hours)
```bash
# All language files:
- src/strings/translations/ar.ts (2 errors)
- src/strings/translations/de.ts (2 errors)
- src/strings/translations/es.ts (2 errors)
- src/strings/translations/fr.ts (1 error)
- src/strings/translations/it.ts (2 errors)
- src/strings/translations/ja.ts (2 errors)
- src/strings/translations/ko.ts (2 errors)
- src/strings/translations/pt.ts (2 errors)
- src/strings/translations/ru.ts (4 errors)
- src/strings/translations/vi.ts (2 errors)
- src/strings/translations/zh.ts (1 error)
- src/strings/translations/index.ts (2 errors)
- src/strings/ui-strings.ts (7 errors)
- src/strings/translations.ts (1 error)
```

## Common Error Types & Solutions

### 1. Import Path Issues
```typescript
// ❌ Wrong - old relative imports
import { User } from '../../../types/user'
import { Database } from '../../database/types'

// ✅ Correct - monorepo workspace imports  
import { User, Database } from '@civicsense/types'
```

### 2. Missing Type Exports
```typescript
// Add to @civicsense/types/src/index.ts
export type { QuizRepository } from './quiz'
export type { ContentFilter } from './services'
```

### 3. Environment Variable Types
```typescript
// Create proper env types in @civicsense/types
export interface EnvironmentConfig {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  // ... other env vars
}
```

### 4. Service Dependency Injection
```typescript
// Update service constructors to use proper DI
export class QuizService {
  constructor(
    private database: Database,
    private auth: AuthService
  ) {}
}
```

## Execution Steps

### 1. Pre-work Setup (15 min)
```bash
# Set up error tracking
cd /Users/tanho/GitHub_non_cloud/civic-sense-main/packages/business-logic
npx tsc --noEmit > typescript-errors.log 2>&1

# Create error-tracking branch
git checkout -b fix/typescript-errors
```

### 2. Create helper scripts (15 min)
```bash
# Create scripts/fix-imports.sh
#!/bin/bash
# Find and replace common import patterns
find src -name "*.ts" -type f -exec sed -i '' 's|from .*\/types\/|from "@civicsense/types"|g' {} \;
find src -name "*.ts" -type f -exec sed -i '' 's|from .*\/database\/|from "@civicsense/types/database"|g' {} \;
```

### 3. Fix in priority order (follow phases above)

### 4. Continuous validation
```bash
# After each major fix:
npm run type-check
npm run build

# Track progress:
npx tsc --noEmit | grep -c "error TS" 
```

## Success Metrics
- [ ] **Phase 1**: ≤ 20 TypeScript errors remaining
- [ ] **Phase 2**: ≤ 50 TypeScript errors remaining  
- [ ] **Phase 3**: ≤ 10 TypeScript errors remaining
- [ ] **Phase 4**: 0 TypeScript errors
- [ ] **Final**: Mobile app starts successfully with `pnpm run start`

## Risk Mitigation

### High-Risk Files (>20 errors)
1. `src/strings/translations/en.ts` (2533 errors) - May need complete rewrite
2. `src/multiplayer/npc-service.ts` (25 errors) - Complex logic
3. `src/quiz/progress-demo.ts` (22 errors) - Demo data structure
4. `src/multiplayer/enhanced-npc-service.ts` (21 errors) - AI integration

### Backup Strategy
- Create backup branch before major changes
- Fix one file at a time and commit frequently
- Test mobile app build after each phase

### Escape Hatch
If any file proves too complex:
1. Create minimal stub implementation
2. Add TODO comments for future fixes
3. Ensure mobile app can start without crashing

## Timeline Estimate
- **Phase 1**: 2-3 hours
- **Phase 2**: 4-5 hours  
- **Phase 3**: 6-8 hours
- **Phase 4**: 2-4 hours
- **Total**: 14-20 hours over 2-3 days

## Next Actions
1. Start with Phase 1 - Foundation fixes
2. Focus on getting mobile app running first
3. Address advanced features incrementally
4. Leave translation system for last (it's likely the least critical for basic functionality)

---

**Ready to start? Let's begin with Phase 1 foundation fixes! 🚀**

# 🚑 Immediate Build-Blockers (June 2025)

We cannot address the >2 000 TypeScript warnings until **Metro can bundle and the app boots**.  The following items unblock the bundler first, then shrink the error surface so the original phased plan (see below) becomes feasible.

| Priority | Fix | Why it Breaks | How to Verify |
|----------|-----|---------------|---------------|
| P0 | Align *@types/* packages with React 18 + RN 0.73 | Animated JSX errors come from mismatched versions – keep `@types/react` 18.2.x, `@types/react-native` 0.73.x only | `tsc --noEmit` has **0** `2786` errors for `Animated.*` or `TouchableOpacity` |
| P0 | Remove all `experiments.reactCanary / reactServerFunctions` flags | Metro injects React-19 Babel plugins → `.plugins` error | `expo start -c` bundles `apps/mobile/index.js` without Babel crash |
| P0 | Consolidate `babel.config.js` to Expo 53 preset only | Local preset overrides pull in incompatible syntax plugins | Fresh Metro restart shows no "unknown plugin" stack trace |
| P0 | tsconfig: use `moduleResolution:"nodenext"`, **but** drop `customConditions` until RN 0.74 | Prevent current TS 5.5 error | VS Code yellow squiggle on `customConditions` is gone |
| P1 | Lock ESLint & Prettier to versions compatible with React-Native 0.73 | Stops dev-server crashing on lint-middleware | `pnpm lint` succeeds |
| P1 | Patch `expo/metro-config` watchFolders to avoid workspace root double-react install | Eliminates duplicate React warning at runtime | App boots with one set of React console warnings |
| P2 | Generate **typed‐module map** for `apps/mobile/lib` & `components` and add to `paths` | Removes ~600 "file not in project" errors | `tsc --noEmit` < 1 000 errors |
| P2 | Create "shim.d.ts" for missing native modules (e.g. `expo-blur` types) | Clears remaining 230 TS 2307 errors | `tsc` < 400 errors |
| P3 | Begin original Phase 1 Foundation fixes (database, auth, feature-flags) | See original plan | `pnpm run type-check` < 100 errors |

---

## 🔄 Updated Implementation Roadmap

1. **Dependencies (Day 0)**
   ```bash
   # inside apps/mobile
   pnpm add -D @types/react@18.2.14 @types/react-native@0.73.18
   pnpm remove react@19 react-native@0.79
   expo install react@18.2.0 react-native@0.73.9 react-native-web@0.19.11
   ```
   *Commit: `fix/mobile-deps-align-expo53`*

2. **Babel / Metro (Day 0)**
   * `apps/mobile/babel.config.js` →
     ```js
     module.exports = { presets: ['babel-preset-expo'] };
     ```
   * Delete any custom plugin arrays.

3. **Expo config (Day 0)**
   Remove the entire `experiments` block from `apps/mobile/app.config.ts`.

4. **tsconfig clean-up (Day 0)**
   ```jsonc
   {
     "compilerOptions": {
       "moduleResolution": "nodenext",
       "module": "NodeNext",
       "skipLibCheck": true,
       "types": ["react-native", "jest"]
     },
     "include": ["app", "src", "lib", "components", "*.ts", "*.tsx"]
   }
   ```
   Remove `customConditions` for now.

5. **Smoke test (Day 0)**
   ```bash
   expo start -c   # should load on iOS Simulator without red-box
   ```

6. **Typed-module mapping (Day 1)**
   * Add `paths` aliases for `lib/*` and `components/*` in **mobile** tsconfig so VS Code stops dropping files.

7. **Shim missing native types (Day 1)**
   Create `apps/mobile/@types/expo-shims.d.ts` with common stubs.

8. **Refill ESLint / Prettier versions (Day 1)** – align with Expo template.

9. **Proceed with original phase breakdown (Day 2-3)** – foundation → core services → advanced → i18n monster file.

---

*The original March 2025 audit remains below for reference.*
