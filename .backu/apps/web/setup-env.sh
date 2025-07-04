#!/bin/bash

# CivicSense Development Environment Setup
echo "Setting up CivicSense development environment..."

# Create .env.local with basic configuration
cat > .env.local << 'EOF'
# CivicSense Development Environment
# IMPORTANT: Replace these with your actual Supabase values

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# =============================================================================
# AUTHENTICATION & SECURITY
# =============================================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-replace-in-production
JWT_SECRET=development-jwt-secret-replace-in-production-with-32-chars

# =============================================================================
# NOTES
# =============================================================================
# This is a basic configuration to prevent startup errors.
# For full functionality, you'll need to:
# 1. Set up a Supabase project at https://supabase.com
# 2. Replace the placeholder values above with your actual Supabase credentials
# 3. Copy additional environment variables from environment-template.txt as needed
EOF

echo "✅ Created .env.local with placeholder values"
echo "⚠️  IMPORTANT: Replace placeholder Supabase values with your actual credentials"
echo "📖 See environment-template.txt for all available configuration options" 