#!/bin/bash

# Fix all UI component import paths from specific to package imports
echo "Fixing UI component import paths..."

# Define the files to fix
files=$(find app -name "*.tsx" -type f -exec grep -l "@civicsense/ui-web/components/ui/" {} \;)

for file in $files; do
  echo "Processing: $file"
  
  # Replace specific import paths with package imports
  sed -i '' 's|@civicsense/ui-web/components/ui/[a-zA-Z-]*|@civicsense/ui-web|g' "$file"
  
  # Clean up any duplicate import lines (basic cleanup)
  # This will be handled by the TypeScript compiler and linter
done

echo "Fixed imports in $(echo "$files" | wc -l) files"
