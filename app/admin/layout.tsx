'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useAdmin } from '@/lib/admin-access'
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
import { Suspense } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'

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
    name: 'Unified AI Tools',
    href: '/admin/unified-ai-tools',
    icon: Brain,
    category: 'Tools'
  },
  {
    name: 'Congressional Data',
    href: '/admin/congressional',
    icon: Shield,
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
  {
    name: 'OneSignal',
    href: '/admin/onesignal',
    icon: MessageSquare,
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
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  // Handle authentication and admin access
  useEffect(() => {
    if (!adminLoading) {
      if (!user) {
        router.push('/auth/signin?redirect=/admin')
        return
      }
      
      if (!isAdmin) {
        router.push('/dashboard?error=access_denied')
        return
      }
    }
  }, [user, isAdmin, adminLoading, router])

  // Show loading while checking admin access
  if (adminLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 font-light">
            {adminLoading ? 'Verifying admin access...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="flex h-screen">
        {/* Minimal Sidebar */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Clean Header */}
          <AdminHeader />
          
          {/* Content Area with Generous Spacing */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">
              {/* Minimal Breadcrumb */}
              <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="px-8 py-6">
                  <Suspense fallback={<div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />}>
                    <AdminBreadcrumb />
                  </Suspense>
                </div>
              </div>
              
              {/* Page Content with Apple-esque Spacing */}
              <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                <Suspense fallback={
                  <div className="space-y-12">
                    <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                }>
                  {children}
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 