'use client'

// Alternative approach if hydration issues persist:
// Use dynamic import with SSR disabled in the parent component that imports this layout:
// 
// const AdminLayoutClient = dynamic(() => import('./layout'), {
//   ssr: false,
//   loading: () => (
//     <div className="min-h-screen flex items-center justify-center bg-slate-50">
//       <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
//     </div>
//   )
// })

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings, 
  Brain, 
  MessageSquare, 
  Shield,
  Bookmark,
  Globe,
  Target,
  TrendingUp,
  UserCheck,
  Database,
  Zap,
  Search,
  Archive,
  Star,
  AlertCircle,
  Home,
  Menu,
  X,
  ChevronRight,
  BookOpen
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Flattened navigation structure for easier access
const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    category: 'Overview'
  },
  // Content Management
  {
    name: 'Topics & Questions',
    href: '/admin/question-topics',
    icon: Target,
    category: 'Content'
  },
  {
    name: 'Glossary',
    href: '/admin/glossary',
    icon: BookOpen,
    category: 'Content'
  },
  {
    name: 'AI Content',
    href: '/admin/ai-content',
    icon: Brain,
    category: 'Content'
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: Calendar,
    category: 'Content'
  },
  {
    name: 'Surveys',
    href: '/admin/surveys',
    icon: MessageSquare,
    category: 'Content'
  },
  // Analytics
  {
    name: 'Content Analytics',
    href: '/admin/analytics/content',
    icon: TrendingUp,
    category: 'Analytics'
  },
  {
    name: 'User Analytics',
    href: '/admin/analytics/users',
    icon: BarChart3,
    category: 'Analytics'
  },
  // Users
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    category: 'Users'
  },
  {
    name: 'Feedback',
    href: '/admin/feedback',
    icon: MessageSquare,
    category: 'Users'
  },
  {
    name: 'Accessibility',
    href: '/admin/accessibility',
    icon: Shield,
    category: 'Users'
  },
  // Media & Tools
  {
    name: 'Media Organizations',
    href: '/admin/media/organizations',
    icon: Globe,
    category: 'Tools'
  },
  {
    name: 'AI Tools',
    href: '/admin/ai-tools',
    icon: Zap,
    category: 'Tools'
  },
  {
    name: 'Content Relationships',
    href: '/admin/content-relationships',
    icon: Search,
    category: 'Tools'
  },
  {
    name: 'News Agent',
    href: '/admin/news-agent',
    icon: Zap,
    category: 'Tools'
  },
  {
    name: 'Translations',
    href: '/admin/translations',
    icon: Globe,
    category: 'Tools'
  },
  // System
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    category: 'System'
  }
]

const categories = [
  { name: 'Overview', items: adminNavigation.filter(item => item.category === 'Overview') },
  { name: 'Content', items: adminNavigation.filter(item => item.category === 'Content') },
  { name: 'Analytics', items: adminNavigation.filter(item => item.category === 'Analytics') },
  { name: 'Users', items: adminNavigation.filter(item => item.category === 'Users') },
  { name: 'Tools', items: adminNavigation.filter(item => item.category === 'Tools') },
  { name: 'System', items: adminNavigation.filter(item => item.category === 'System') }
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const { isAdmin, isSuperAdmin, role, isLoading: adminLoading, error } = useAdminAccess()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)

  // Fix hydration by ensuring client-side mounting
  useEffect(() => {
    setIsClientMounted(true)
  }, [])

  // Debug logging for admin access
  useEffect(() => {
    if (isClientMounted) {
      console.log('🔍 AdminLayout Status:', {
        isClientMounted,
        authLoading,
        adminLoading,
        hasUser: !!user,
        userEmail: user?.email,
        isAdmin,
        isSuperAdmin,
        role,
        error
      })
    }
  }, [isClientMounted, authLoading, adminLoading, user, isAdmin, isSuperAdmin, role, error])

  const isActivePath = (href: string) => {
    // Prevent hydration mismatch by only computing on client
    if (!isClientMounted) return false
    
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  // Show appropriate loading/error states based on authentication
  if (!isClientMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show error if authentication failed
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Required</h2>
            <p className="text-red-600">You need to be signed in to access the admin panel.</p>
            <Button 
              onClick={() => router.push('/auth/signin')} 
              className="mt-4"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show error if admin access failed
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Admin Access Required</h2>
            <p className="text-amber-600">
              You don't have administrator privileges. If you believe this is an error, please contact support.
            </p>
            <div className="mt-4 space-x-2">
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Retry
              </Button>
            </div>
            {error && (
              <p className="text-xs text-amber-500 mt-2">Error: {error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 transform transition-transform duration-300 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/60 dark:border-slate-700/60">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Admin
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              CivicSense
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8 p-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {category.name}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActivePath(item.href)
                        ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"
                    )}>
                      <item.icon className={cn(
                        "mr-3 h-4 w-4 transition-colors",
                        isActivePath(item.href) ? "text-white" : "text-slate-500 dark:text-slate-400"
                      )} />
                      <span className="truncate">{item.name}</span>
                      {isActivePath(item.href) && (
                        <ChevronRight className="ml-auto h-3 w-3 text-white/70" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-200/60 dark:border-slate-700/60 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-slate-900 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {role}
                </p>
                {isSuperAdmin && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                    Super
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild className="text-sm">
                <Link href="/">
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 