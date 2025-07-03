#!/bin/bash

# Update imports in ui-web package
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/types/quiz|@/lib/quiz/types|g'
find ./packages/ui-web/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/quiz-data|@/lib/quiz/quiz-data|g'

# Update imports in web app
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/types/quiz|@civicsense/ui-web|g'
find ./apps/web -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@civicsense/shared/lib/quiz-data|@civicsense/ui-web|g'

echo "Quiz imports have been updated!" 