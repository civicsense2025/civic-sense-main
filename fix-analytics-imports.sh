#!/bin/bash

# Update imports in ui-web package
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/analytics|@/lib/analytics/analytics|g'
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/analytics|@/lib/analytics/analytics|g'

# Update imports in web app
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/analytics|@civicsense/ui-web|g'
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/analytics|@civicsense/ui-web|g'

echo "Analytics imports have been updated!" 