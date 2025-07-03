#!/bin/bash

# Function to fix imports in a file
fix_imports() {
  local file=$1
  echo "Fixing imports in $file"
  
  # Replace the import statement
  sed -i '' 's|from '"'"'@civicsense/shared/lib/use-toast'"'"'|from "../components/ui/use-toast"|g' "$file"
  sed -i '' 's|from '"'"'@civicsense/shared/lib/use-toast'"'"'|from "../../components/ui/use-toast"|g' "$file"
  sed -i '' 's|from '"'"'@civicsense/shared/lib/use-toast'"'"'|from "./components/ui/use-toast"|g' "$file"
}

# Process each file
while IFS= read -r file; do
  if [[ -f "$file" ]]; then
    fix_imports "$file"
  fi
done << "EOF"
apps/web/app/components/feedback/accessibility-feedback.tsx
packages/ui-web/src/learning-pods/pod-notifications-activity.tsx
packages/ui-web/src/learning-pods/pod-member-management.tsx
packages/ui-web/src/learning-pods/pod-discovery.tsx
packages/ui-web/src/learning-pods/pod-management-dashboard.tsx
packages/ui-web/src/learning-pods/join-request-notifications.tsx
packages/ui-web/src/learning-pods/pod-analytics.tsx
packages/ui-web/src/learning-pods/aggregate-pod-analytics.tsx
packages/ui-web/src/learning-pods/enhanced-pod-analytics.tsx
packages/ui-web/src/learning-pods/create-pod-wizard.tsx
packages/ui-web/src/learning-pods/parental-controls.tsx
packages/ui-web/src/learning-pods/enhanced-pod-creation-wizard.tsx
packages/ui-web/src/learning-pods/family-pod-manager.tsx
packages/ui-web/src/onboarding/onboarding-flow.tsx
packages/ui-web/src/onboarding/steps/completion-step.tsx
packages/ui-web/src/multiplayer/waiting-room.tsx
packages/ui-web/src/multiplayer/multiplayer-lobby-new.tsx
packages/ui-web/src/multiplayer/join-room-dialog.tsx
packages/ui-web/src/multiplayer/create-room-dialog.tsx
packages/ui-web/src/multiplayer/lobby.tsx
packages/ui-web/src/events/event-submission-dialog.tsx
packages/ui-web/src/enhanced-social-share.tsx
packages/ui-web/src/pods/pod-header.tsx
packages/ui-web/src/components/onboarding/onboarding-flow.tsx
packages/ui-web/src/components/onboarding/steps/completion-step.tsx
packages/ui-web/src/components/multiplayer/waiting-room.tsx
packages/ui-web/src/components/multiplayer/create-room-dialog.tsx
packages/ui-web/src/components/multiplayer/join-room-dialog.tsx
packages/ui-web/src/components/multiplayer/multiplayer-lobby-new.tsx
packages/ui-web/src/components/multiplayer/lobby.tsx
packages/ui-web/src/components/events/event-submission-dialog.tsx
packages/ui-web/src/components/enhanced-social-share.tsx
packages/ui-web/src/components/.temp-disabled/feedback/accessibility-feedback.tsx
packages/ui-web/src/components/.temp-disabled/feedback/accessibility-feedback-form.tsx
packages/ui-web/src/components/learning-pods/pod-notifications-activity.tsx
packages/ui-web/src/components/learning-pods/pod-management-dashboard.tsx
packages/ui-web/src/components/learning-pods/pod-analytics.tsx
packages/ui-web/src/components/learning-pods/pod-member-management.tsx
packages/ui-web/src/components/learning-pods/join-request-notifications.tsx
packages/ui-web/src/components/learning-pods/pod-discovery.tsx
packages/ui-web/src/components/learning-pods/enhanced-pod-creation-wizard.tsx
packages/ui-web/src/components/learning-pods/enhanced-pod-analytics.tsx
packages/ui-web/src/components/learning-pods/create-pod-wizard.tsx
packages/ui-web/src/components/learning-pods/aggregate-pod-analytics.tsx
packages/ui-web/src/components/learning-pods/parental-controls.tsx
packages/ui-web/src/components/learning-pods/family-pod-manager.tsx
packages/ui-web/src/components/pods/pod-header.tsx
packages/ui-web/src/components/source-metadata-card-enhanced.tsx
packages/ui-web/src/components/integrations/classroom-integration-panel.tsx
packages/ui-web/src/components/integrations/google-classroom-sync-dialog.tsx
packages/ui-web/src/components/integrations/lms-integration-panel.tsx
packages/ui-web/src/components/integrations/google-classroom-pod-creator.tsx
packages/ui-web/src/components/integrations/institutional-pod-manager.tsx
packages/ui-web/src/components/providers/connection-provider.tsx
packages/ui-web/src/components/learning-pods-dashboard.tsx
packages/ui-web/src/components/gift-credits-manager.tsx
packages/ui-web/src/components/auth/password-reset-form.tsx
packages/ui-web/src/components/auth/donation-form.tsx
packages/ui-web/src/components/auth/consolidated-auth-form.tsx
packages/ui-web/src/components/accessibility-feedback-form.tsx
packages/ui-web/src/components/auth/sign-up-form.tsx
packages/ui-web/src/components/auth/sign-in-form.tsx
packages/ui-web/src/components/news-ticker.tsx
packages/ui-web/src/components/ui/translation-contribution-modal.tsx
packages/ui-web/src/components/ui/toaster.tsx
packages/ui-web/src/integrations/google-classroom-sync-dialog.tsx
packages/ui-web/src/integrations/institutional-pod-manager.tsx
packages/ui-web/src/integrations/google-classroom-pod-creator.tsx
packages/ui-web/src/integrations/lms-integration-panel.tsx
packages/ui-web/src/integrations/classroom-integration-panel.tsx
packages/ui-web/src/feedback/accessibility-feedback.tsx
packages/ui-web/src/feedback/accessibility-feedback-form.tsx
packages/ui-web/src/source-metadata-card-enhanced.tsx
packages/ui-web/src/providers/connection-provider.tsx
packages/ui-web/src/auth/consolidated-auth-form.tsx
packages/ui-web/src/auth/sign-up-form.tsx
packages/ui-web/src/learning-pods-dashboard.tsx
packages/ui-web/src/gift-credits-manager.tsx
packages/ui-web/src/accessibility-feedback-form.tsx
packages/ui-web/src/news-ticker.tsx
packages/ui-web/src/ui/translation-contribution-modal.tsx
packages/ui-web/src/ui/toaster.tsx
EOF 