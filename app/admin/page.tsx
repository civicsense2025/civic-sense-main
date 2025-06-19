"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { 
  Brain, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Users, 
  Settings,
  ArrowRight,
  Shield
} from "lucide-react"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminAccess()
  const { toast } = useToast()

  // Check admin access and redirect if unauthorized
  useEffect(() => {
    if (!user) return
    
    if (adminError) {
      toast({
        title: "Access Error",
        description: "Could not verify admin permissions",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
    
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions to access this panel",
        variant: "destructive"
      })
      window.location.href = '/dashboard'
      return
    }
  }, [user, isAdmin, adminLoading, adminError, toast])

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  const adminTools = [
    {
      title: "AI Content Review",
      description: "Review and manage civic education content extracted from news articles",
      icon: Brain,
      href: "/admin/ai-content",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      primary: true
    },
    {
      title: "Survey Management",
      description: "Manage surveys and collect user feedback",
      icon: FileText,
      href: "/admin/surveys",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Feedback Review",
      description: "Review user feedback and support requests",
      icon: MessageSquare,
      href: "/admin/feedback",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header onSignInClick={() => {}} />
      <main className="w-full py-8">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                <Shield className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Manage and oversee CivicSense platform operations
            </p>
          </div>

          {/* Welcome Message */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">
                  Welcome back, {user?.email?.split('@')[0]}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  You have admin access to all platform management tools
                </p>
              </div>
            </div>
          </div>

          {/* Admin Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Card 
                  key={tool.href}
                  className={`border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-200 ${
                    tool.primary ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      <CardTitle className="text-lg font-medium">
                        {tool.title}
                        {tool.primary && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {tool.description}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={tool.href} className="flex items-center justify-center gap-2">
                        Open Tool
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Stats */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                Quick Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    Active
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">System Status</p>
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    {adminTools.length}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">Admin Tools</p>
                </div>
                
                <div className="space-y-2">
                  <div className="text-2xl font-light text-slate-900 dark:text-white">
                    Latest
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-light">Platform Version</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Hint */}
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Use the navigation above or select a tool to get started. 
              Need help? Check the documentation or contact support.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
} 