#!/bin/bash

echo "🔧 Fixing comprehensive import paths for monorepo..."

# Function to replace imports in all .tsx and .ts files
fix_imports() {
    find app -name "*.tsx" -o -name "*.ts" | while read file; do
        # Skip files that don't exist or are not readable
        if [[ ! -r "$file" ]]; then
            continue
        fi
        
        echo "Processing: $file"
        
        # Fix UI component imports
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/button['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/card['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/badge['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/skeleton['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/input['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/label['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/textarea['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui/dialog['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        
        # Fix layout component imports
        sed -i '' "s|import { \([^}]*\) } from ['\"]@/components/ui['\"]|import { \1 } from '@civicsense/ui-web'|g" "$file"
        
        # Fix specific component imports
        sed -i '' "s|import { Header } from ['\"]@/components/header['\"]|import { Header } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { Calendar } from ['\"]@/components/calendar['\"]|import { Calendar } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { DailyCardStack } from ['\"]@/components/daily-card-stack['\"]|import { DailyCardStack } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { AuthDialog } from ['\"]@/components/auth/auth-dialog['\"]|import { AuthDialog } from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { useAuth } from ['\"]@/components/auth/auth-provider['\"]|import { useAuth } from '@civicsense/ui-web'|g" "$file"
        
        # Fix utility imports
        sed -i '' "s|import { cn } from ['\"]@/lib/utils['\"]|import { cn } from '@civicsense/ui-web'|g" "$file"
    done
}

# Run the import fixes
fix_imports

echo "✅ Import path fixes completed!"
echo "📝 Note: Some components may still need manual creation or migration"
echo "🔍 Run 'npm run build' to check for remaining issues" 