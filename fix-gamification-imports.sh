#!/bin/bash

# Update imports in ui-web package
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/enhanced-progress-storage|@/lib/gamification/progress-operations|g'
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/types|@/lib/gamification/types|g'

# Update imports in web app
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/enhanced-progress-storage|@civicsense/ui-web|g'
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/types|@civicsense/ui-web|g'

echo "Gamification imports have been updated!" 