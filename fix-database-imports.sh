#!/bin/bash

# Update imports in ui-web package
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/database.types|@/lib/types/database|g'

# Update imports in web app
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/database.types|@civicsense/ui-web|g'

echo "Database type imports have been updated!" 