'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

const pathLabels: Record<string, string> = {
  admin: 'Dashboard',
  'question-topics': 'Question Topics',
  collections: 'Collections',
  glossary: 'Glossary',
  events: 'Events',
  'content-relationships': 'Content Relationships',
  'ai-content': 'AI Content',
  'ai-tools': 'AI Tools',
  'news-agent': 'News Agent',
  'ai-collection-organizer': 'Collection Organizer',
  congressional: 'Congressional Data',
  representatives: 'Representatives',
  media: 'Media',
  organizations: 'Organizations',
  users: 'Users',
  surveys: 'Surveys',
  feedback: 'Feedback',
  settings: 'Settings',
  accessibility: 'Accessibility',
  translations: 'Translations',
  analytics: 'Analytics',
  'debug-data': 'Debug Data',
  create: 'Create',
  edit: 'Edit'
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  
  // Generate breadcrumb items from path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 1 && segments[0] === 'admin') {
      return [{ label: 'Dashboard', href: '/admin', current: true }]
    }
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin' }
    ]
    
    let currentPath = ''
    
    segments.forEach((segment, index) => {
      if (segment === 'admin') return
      
      currentPath += `/${segment}`
      const fullPath = `/admin${currentPath}`
      
      // Get label for segment
      let label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Special handling for dynamic routes (like IDs)
      if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^[0-9]+$/)) {
        label = 'Details'
      }
      
      // Check if this is the last segment
      const isLast = index === segments.length - 2 // -2 because we skip 'admin'
      
      breadcrumbs.push({
        label,
        href: fullPath,
        current: isLast
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  if (breadcrumbs.length <= 1) {
    return (
      <div className="flex items-center space-x-2">
        <Home className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Admin Dashboard
        </span>
      </div>
    )
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Home className="h-4 w-4 text-gray-500" />
      
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-gray-400" />
          )}
          
          {item.current ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {item.label}
            </span>
          ) : (
            <Link 
              href={item.href}
              className={cn(
                "font-medium transition-colors",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
} 