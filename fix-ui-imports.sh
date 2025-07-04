#!/bin/bash

# Function to update imports in a file
update_imports() {
  local file=$1
  
  # Replace UI component imports
  sed -i '' 's/from '\''@civicsense\/ui-web'\''/from "\.\.\/\.\.\/components\/ui"/g' "$file"
  sed -i '' 's/from '\''@civicsense\/ui-web'\''/from "@\/components\/ui"/g' "$file"
  
  # Replace useAuth imports
  sed -i '' 's/import { useAuth } from '\''@civicsense\/ui-web'\''/import { useAuth } from "@\/components\/auth\/auth-provider"/g' "$file"
  
  # Replace useToast imports
  sed -i '' 's/import { useToast } from '\''@civicsense\/ui-web'\''/import { useToast } from "@\/components\/ui"/g' "$file"
}

# Find all TypeScript/JavaScript files in the web app directory
find apps/web -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  if grep -q "@civicsense/ui-web" "$file"; then
    echo "Updating imports in $file"
    update_imports "$file"
  fi
done 