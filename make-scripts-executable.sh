#!/bin/bash

# Make all fix scripts executable
chmod +x fix-monorepo.sh
chmod +x quick-fix-monorepo.sh
chmod +x check-monorepo-health.js

echo "✅ All scripts are now executable"
echo ""
echo "Available commands:"
echo "  ./fix-monorepo.sh         - Basic monorepo fix"
echo "  ./quick-fix-monorepo.sh   - Comprehensive automated fix"
echo "  node check-monorepo-health.js - Health diagnostics"
echo ""
