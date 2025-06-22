"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  BookOpen, 
  Users, 
  MessageSquare, 
  TrendingUp,
  ExternalLink,
  Play,
  PenTool,
  Gavel,
  Vote,
  DollarSign,
  Coffee,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkItem {
  id: string
  title: string
  description: string
  href: string
  icon: React.ReactNode
  isExternal?: boolean
  isPrimary?: boolean
  isNew?: boolean
  category: 'content' | 'resource' | 'action'
}

export function LinksPageClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Featured links organized by category
  const featuredLinks: LinkItem[] = [
    // Latest Content
    {
      id: 'latest-quiz',
      title: 'Constitutional Rights Quiz',
      description: 'Test your knowledge of constitutional protections',
      href: '/quiz/constitutional-rights',
      icon: <Play className="h-4 w-4" />,
      isPrimary: true,
      isNew: true,
      category: 'content'
    },
    {
      id: 'civics-test',
      title: 'Full Civics Assessment',
      description: 'Comprehensive test of your civic knowledge',
      href: '/civics-test',
      icon: <PenTool className="h-4 w-4" />,
      category: 'content'
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Civic Battle',
      description: 'Challenge friends to civic knowledge duels',
      href: '/multiplayer',
      icon: <Users className="h-4 w-4" />,
      isNew: true,
      category: 'content'
    },
    
    // Resources
    {
      id: 'categories',
      title: 'Browse All Topics',
      description: 'Explore civic education by category',
      href: '/categories',
      icon: <BookOpen className="h-4 w-4" />,
      category: 'resource'
    },
    {
      id: 'glossary',
      title: 'Civic Terms Glossary',
      description: 'Understand key civic and political terms',
      href: '/glossary',
      icon: <Gavel className="h-4 w-4" />,
      category: 'resource'
    },
    {
      id: 'public-figures',
      title: 'Know Your Representatives',
      description: 'Learn about current political figures',
      href: '/public-figures',
      icon: <Vote className="h-4 w-4" />,
      category: 'resource'
    },
    
    // Actions
    {
      id: 'donate',
      title: 'Support Our Mission',
      description: 'Help us expand civic education access',
      href: '/donate',
      icon: <Heart className="h-4 w-4" />,
      isPrimary: true,
      category: 'action'
    },
    {
      id: 'schools',
      title: 'Bring CivicSense to Schools',
      description: 'Educational institution partnerships',
      href: '/schools',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'action'
    }
  ]

  const quickStats = [
    { label: 'Active Learners', value: '50K+', icon: <Users className="h-4 w-4" /> },
    { label: 'Quiz Questions', value: '2,500+', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Topics Covered', value: '100+', icon: <BookOpen className="h-4 w-4" /> }
  ]

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl">
              <Zap className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              CivicSense
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              Civic education that politicians don't want you to have. 
              <br />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Learn how power actually works.
              </span>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-1 text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Action - Donate */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Support Our Mission
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Help us make civic education accessible to everyone
                </p>
              </div>
              <Link href="/donate">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Donate
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Latest Content Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-600" />
              Start Learning
            </h2>
            <Badge variant="secondary" className="text-xs">
              Interactive
            </Badge>
          </div>
          
          {featuredLinks
            .filter(link => link.category === 'content')
            .map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
        </div>

        {/* Resources Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Resources
          </h2>
          
          {featuredLinks
            .filter(link => link.category === 'resource')
            .map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
        </div>

        {/* Actions Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Take Action
          </h2>
          
          {featuredLinks
            .filter(link => link.category === 'action')
            .map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
        </div>

        {/* Social Proof / Newsletter */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              "Finally, civic education that doesn't sugarcoat how power works"
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              — Trusted by 50,000+ learners
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4 space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © 2024 CivicSense • Civic education for democracy
          </p>
        </div>
      </div>
    </div>
  )
}

function LinkCard({ link }: { link: LinkItem }) {
  const CardComponent = link.isExternal ? 'a' : Link
  const cardProps = link.isExternal 
    ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
    : { href: link.href }

  return (
    <CardComponent {...cardProps} className="block">
      <Card className={cn(
        "border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        link.isPrimary 
          ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20" 
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                link.isPrimary 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {link.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                    {link.title}
                  </h3>
                  {link.isNew && (
                    <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {link.isExternal ? (
                <ExternalLink className="h-4 w-4 text-slate-400" />
              ) : (
                <ArrowRight className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardComponent>
  )
} 