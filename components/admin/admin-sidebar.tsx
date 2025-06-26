'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Users,
  Settings,
  BookOpen,
  BarChart3,
  Globe,
  Brain,
  FileText,
  Calendar,
  Shield,
  Zap,
  MessageSquare,
  Database,
  Newspaper,
  Camera,
  School,
  Target,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X,
  Menu,
  Activity,
  TrendingUp,
  Building,
  Archive,
  Eye,
  Languages,
  UserCheck
} from 'lucide-react'

interface NavigationGroup {
  name: string
  icon: any
  description?: string
  color: string
  items: NavigationItem[]
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
  beta?: boolean
  description?: string
}

const navigationGroups: NavigationGroup[] = [
  {
    name: 'Overview',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'System overview & metrics' },
      { name: 'Analytics', href: '/admin/analytics/users', icon: BarChart3, description: 'User engagement insights' },
      { name: 'Debug Data', href: '/admin/debug-data', icon: Activity, description: 'System diagnostics' }
    ]
  },
  {
    name: 'Content',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-500',
    items: [
      { name: 'Question Topics', href: '/admin/question-topics', icon: Target, description: 'Quiz topics & questions' },
      { name: 'Collections', href: '/admin/collections', icon: Archive, description: 'Learning pathways' },
      { name: 'Glossary', href: '/admin/glossary', icon: BookOpen, description: 'Term definitions' },
      { name: 'Events', href: '/admin/events', icon: Calendar, description: 'Historical & current events' },
      { name: 'Content Relationships', href: '/admin/content-relationships', icon: TrendingUp, description: 'AI-powered connections', beta: true }
    ]
  },
  {
    name: 'AI & Automation',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    items: [
      { name: 'AI Content', href: '/admin/ai-content', icon: Sparkles, description: 'Generate content from news' },
      { name: 'AI Tools', href: '/admin/ai-tools', icon: Brain, description: 'AI service management' },
      { name: 'News Agent', href: '/admin/news-agent', icon: Newspaper, description: 'Automated news monitoring' },
      { name: 'Collection Organizer', href: '/admin/ai-collection-organizer', icon: Archive, description: 'Smart content curation', beta: true }
    ]
  },
  {
    name: 'Data Sources',
    icon: Database,
    color: 'from-orange-500 to-red-500',
    items: [
      { name: 'Congressional', href: '/admin/congressional', icon: Building, description: 'Congress data & photos' },
      { name: 'Representatives', href: '/admin/representatives', icon: UserCheck, description: 'Elected officials' },
      { name: 'Media Organizations', href: '/admin/media/organizations', icon: Globe, description: 'News source tracking' }
    ]
  },
  {
    name: 'Community',
    icon: Users,
    color: 'from-indigo-500 to-blue-500',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users, description: 'User management' },
      { name: 'Surveys', href: '/admin/surveys', icon: MessageSquare, description: 'Community feedback' },
      { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare, description: 'User reports & suggestions' }
    ]
  },
  {
    name: 'System',
    icon: Settings,
    color: 'from-slate-500 to-gray-500',
    items: [
      { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'System configuration' },
      { name: 'Accessibility', href: '/admin/accessibility', icon: Shield, description: 'WCAG compliance tools' },
      { name: 'Translations', href: '/admin/translations', icon: Languages, description: 'Multi-language support' }
    ]
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Overview', 'Content']))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const activeGroup = navigationGroups.find(group => 
    group.items.some(item => isActivePath(item.href))
  )

  useEffect(() => {
    if (activeGroup) {
      setExpandedGroups(prev => new Set([...prev, activeGroup.name]))
    }
  }, [activeGroup])

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-6 left-6 z-50 lg:hidden h-10 w-10 p-0 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-200 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="h-24 px-6 flex items-center border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                Admin
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CivicSense
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-auto h-8 w-8 p-0 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-8 overflow-y-auto">
          {navigationGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.name)
            const hasActiveItem = group.items.some(item => isActivePath(item.href))
            
            return (
              <div key={group.name} className="space-y-3">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <group.icon className="h-4 w-4" />
                    <span className="uppercase tracking-wide text-xs">{group.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="space-y-1 pl-6">
                    {group.items.map((item) => {
                      const isActive = isActivePath(item.href)
                      
                      return (
                        <Link key={item.href} href={item.href}>
                          <div className={cn(
                            "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                            isActive
                              ? "bg-black dark:bg-white text-white dark:text-black"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                          )}>
                            <div className="flex items-center space-x-3 min-w-0">
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate font-medium">{item.name}</span>
                              {item.beta && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200">
                                  Beta
                                </Badge>
                              )}
                            </div>
                            
                            {item.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              System Status
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
} 