#!/bin/bash

echo "Fixing Header import paths..."

# Replace the specific header imports
find app -name "*.tsx" -type f -exec sed -i '' "s|import { Header } from ['\"]@civicsense/ui-web/components/header['\"]|import { Header } from '@civicsense/ui-web'|g" {} \;

echo "Fixed all Header imports!"
