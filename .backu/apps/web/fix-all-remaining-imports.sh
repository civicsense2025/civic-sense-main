#!/bin/bash

echo "🔧 Fixing all remaining import paths for monorepo..."

# Function to replace imports in all .tsx and .ts files
fix_imports() {
    find app -name "*.tsx" -o -name "*.ts" | while read file; do
        # Skip files that don't exist or are not readable
        if [[ ! -r "$file" ]]; then
            continue
        fi
        
        echo "Processing: $file"
        
        # Fix remaining UI component imports
        sed -i '' "s|from '@/components/ui/dialog'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/toast'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/tooltip'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/dropdown-menu'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/select'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/checkbox'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/radio-group'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/switch'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/slider'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/tabs'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/accordion'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/collapsible'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/popover'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/sheet'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/navigation-menu'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/command'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/table'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/calendar'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/avatar'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/aspect-ratio'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/breadcrumb'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/context-menu'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/hover-card'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/menubar'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/pagination'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/resizable'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/scroll-area'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/sonner'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/toggle'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/ui/toggle-group'|from '@civicsense/ui-web'|g" "$file"
        
        # Fix specific component imports
        sed -i '' "s|from '@/components/auth/user-menu'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/quiz/quiz-card'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/quiz/quiz-engine'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/quiz/quiz-results'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/quiz/quiz-question'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/multiplayer/lobby'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/multiplayer/game'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|from '@/components/multiplayer/results'|from '@civicsense/ui-web'|g" "$file"
        
        # Fix lib imports
        sed -i '' "s|from '@/lib/utils'|from '@civicsense/ui-web'|g" "$file"
        sed -i '' "s|import { cn } from '@/lib/utils'|import { cn } from '@civicsense/ui-web'|g" "$file"
        
    done
}

# Run the import fixes
fix_imports

echo "✅ All import paths have been updated to use @civicsense/ui-web" 