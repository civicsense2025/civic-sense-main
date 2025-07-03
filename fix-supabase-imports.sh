#!/bin/bash

# Function to fix imports in a file
fix_imports() {
  local file=$1
  echo "Fixing imports in $file"
  
  # Replace the import statements
  sed -i '' 's|from '"'"'@civicsense/shared/lib/supabase'"'"'|from "../lib/supabase/client"|g' "$file"
  sed -i '' 's|from '"'"'@civicsense/shared/lib/supabase/client'"'"'|from "../lib/supabase/client"|g' "$file"
  sed -i '' 's|from '"'"'@civicsense/shared/lib/supabase-realtime'"'"'|from "../lib/supabase/realtime"|g' "$file"
}

# Process each file
while IFS= read -r file; do
  if [[ -f "$file" ]]; then
    fix_imports "$file"
  fi
done << "EOF"
packages/ui-web/src/onboarding/steps/assessment-step.tsx
packages/ui-web/src/providers/connection-provider.tsx
packages/ui-web/src/components/recommended-topics.tsx
packages/ui-web/src/components/onboarding/onboarding-flow.tsx
packages/ui-web/src/components/onboarding/onboarding-guard.tsx
packages/ui-web/src/components/multiplayer/pvp-game-engine.tsx
packages/ui-web/src/components/premium-data-teaser.tsx
packages/ui-web/src/components/language-settings.tsx
packages/ui-web/src/components/continue-learning.tsx
packages/ui-web/src/components/quiz/admin-edit-panel.tsx
packages/ui-web/src/components/quiz/quiz-engine.tsx
packages/ui-web/src/components/quiz/v2/engine/quiz-engine-v2.tsx
packages/ui-web/src/components/auth/google-oauth-button.tsx
packages/ui-web/src/components/auth/consolidated-auth-form.tsx
packages/ui-web/src/components/auth/sign-up-form.tsx
packages/ui-web/src/components/auth/user-menu.tsx
packages/ui-web/src/components/learning-pods/pod-analytics-dashboard.tsx
packages/ui-web/src/components/auth/password-reset-form.tsx
packages/ui-web/src/components/auth/sign-in-form.tsx
packages/ui-web/src/components/premium-analytics.tsx
packages/ui-web/src/components/daily-card-stack.tsx
packages/ui-web/src/components/auth/auth-provider.tsx
packages/ui-web/src/components/learning-pods/pod-activity-feed.tsx
packages/ui-web/src/components/learning-pods/pod-member-management.tsx
packages/ui-web/src/components/providers/connection-provider.tsx
packages/ui-web/src/onboarding/onboarding-flow.tsx
packages/ui-web/src/onboarding/onboarding-guard.tsx
packages/ui-web/src/multiplayer/pvp-game-engine.tsx
packages/ui-web/src/components/civics-test-assessment.tsx
packages/ui-web/src/premium-data-teaser.tsx
packages/ui-web/src/lib/supabase/client.ts
packages/ui-web/src/learning-pods/pod-activity-feed.tsx
packages/ui-web/src/learning-pods/pod-member-management.tsx
packages/ui-web/src/learning-pods/pod-analytics-dashboard.tsx
packages/ui-web/src/language-settings.tsx
packages/ui-web/src/continue-learning.tsx
packages/ui-web/src/quiz/admin-edit-panel.tsx
packages/ui-web/src/quiz/quiz-engine.tsx
packages/ui-web/src/quiz/v2/engine/quiz-engine-v2.tsx
packages/ui-web/src/daily-card-stack.tsx
packages/ui-web/src/recommended-topics.tsx
packages/ui-web/src/auth/google-oauth-button.tsx
packages/ui-web/src/civics-test-assessment.tsx
packages/ui-web/src/auth/consolidated-auth-form.tsx
packages/ui-web/src/auth/password-reset-form.tsx
packages/ui-web/src/premium-analytics.tsx
packages/ui-web/src/auth/sign-up-form.tsx
packages/ui-web/src/auth/sign-in-form.tsx
EOF 