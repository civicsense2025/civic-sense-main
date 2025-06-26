# Admin Access Migration Guide

This guide documents the unified admin access system for CivicSense that resolves all admin panel access issues.

## Summary of Changes

We've consolidated admin access to use a single, consistent approach:

1. **Unified admin middleware** (`lib/admin-middleware.ts`) - Uses `user_roles` table with service role permissions
2. **Updated useAdminAccess hook** - Now uses the admin middleware functions
3. **Next.js middleware protection** - All admin routes protected at the route level
4. **Consistent API route protection** - All admin API routes use the same middleware

## Key Components

### 1. Admin Middleware (`lib/admin-middleware.ts`)

The core admin authentication system that:
- Uses `user_roles` table instead of `profiles.is_admin`
- Bypasses RLS issues with service role permissions
- Works both server-side and client-side
- Provides caching for performance

```typescript
// Core functions available:
- requireAdmin(request)        // For middleware
- requireSuperAdmin(request)   // For super admin routes
- checkAdminAccess()          // For React hooks
- withAdminAuth(handler)      // For API routes
- withSuperAdminAuth(handler) // For super admin API routes
```

### 2. Updated useAdminAccess Hook

Now returns comprehensive admin information:

```typescript
const { isAdmin, isSuperAdmin, role, isLoading, error } = useAdminAccess()

// Returns:
// - isAdmin: boolean
// - isSuperAdmin: boolean  
// - role: 'user' | 'admin' | 'super_admin' | 'moderator'
// - isLoading: boolean
// - error: string | null
```

### 3. Route Protection

All admin routes are protected by Next.js middleware (`middleware.ts`):

```typescript
// Protected routes:
- /admin (all admin routes)
- /admin/settings (super admin only)
- /admin/users/roles (super admin only)
- /admin/system (super admin only)
```

### 4. API Route Patterns

**Recommended pattern for admin API routes:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await requireAdmin(request)
    if (!adminCheck.success || adminCheck.response) {
      return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { user, role } = adminCheck
    console.log(`✅ Admin user ${user.email} accessing API`)

    // Your API logic here...
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Alternative pattern using withAdminAuth utility:**

```typescript
import { withAdminAuth } from '@/lib/admin-middleware'
import { NextResponse } from 'next/server'

export async function GET() {
  return withAdminAuth(async (user, role) => {
    // Your API logic here with guaranteed admin user
    console.log(`✅ Admin user ${user.email} with role ${role}`)
    
    return NextResponse.json({ success: true, data: 'your data' })
  })
}
```

**For super admin routes:**

```typescript
import { withSuperAdminAuth } from '@/lib/admin-middleware'

export async function POST() {
  return withSuperAdminAuth(async (user) => {
    // Super admin only logic
    return NextResponse.json({ success: true })
  })
}
```

## Migration Steps for Existing Code

### 1. Update API Routes

Replace old admin checks:

```typescript
// OLD - Don't use this
const { data: profile } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single()

if (!profile?.is_admin) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

```typescript
// NEW - Use this
const adminCheck = await requireAdmin(request)
if (!adminCheck.success || adminCheck.response) {
  return adminCheck.response || NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

### 2. Update React Components

Components using the hook will automatically get the enhanced functionality:

```typescript
// This will now work with the unified system
const { isAdmin, isSuperAdmin, role, isLoading, error } = useAdminAccess()

if (isLoading) return <div>Checking admin access...</div>
if (error) return <div>Error: {error}</div>
if (!isAdmin) return <div>Access denied</div>

// Show admin content
return <AdminContent />
```

### 3. Database Setup

Ensure you have the `user_roles` table:

```sql
-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Insert admin role for your user
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';
```

## Benefits of This System

1. **Consistent Authentication** - Same logic everywhere
2. **RLS Bypass** - No more permission denied errors
3. **Performance** - Built-in caching
4. **Security** - Proper middleware protection
5. **Flexibility** - Support for multiple admin roles
6. **Debugging** - Clear logging of admin access

## Testing

To verify the system is working:

1. Check that you can access `/admin` routes
2. Verify API routes return proper admin responses
3. Check browser console for admin access logs:
   ```
   ✅ Admin user your-email@example.com accessing /admin/news-agent
   ✅ Admin check for your-email@example.com: { isAdmin: true, isSuperAdmin: false, role: 'admin' }
   ```

## Common Issues and Solutions

### Issue: "permission denied for table users"
**Solution:** This is resolved by the new system that uses `user_roles` table with service role permissions.

### Issue: Inconsistent admin checks
**Solution:** All admin checks now use the same middleware functions.

### Issue: Admin access not working in React components
**Solution:** The updated `useAdminAccess` hook uses the middleware functions automatically.

### Issue: API routes not protected
**Solution:** Use `requireAdmin()` or `withAdminAuth()` in all admin API routes.

## Migration Checklist

- [ ] Admin middleware updated
- [ ] useAdminAccess hook updated  
- [ ] Next.js middleware configured
- [ ] Admin layout updated
- [ ] API routes use new admin check pattern
- [ ] Database has user_roles table
- [ ] User has admin role in user_roles table
- [ ] Test admin access works end-to-end

This unified system resolves all admin access issues and provides a consistent, secure foundation for admin functionality. 