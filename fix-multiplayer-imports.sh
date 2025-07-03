#!/bin/bash

# Update imports in ui-web package
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/multiplayer|@/lib/multiplayer/operations|g'

# Update imports in web app
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/multiplayer|@civicsense/ui-web|g'

echo "Multiplayer imports have been updated!" 