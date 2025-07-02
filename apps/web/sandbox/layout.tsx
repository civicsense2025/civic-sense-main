"use client"

import Link from 'next/link'
import { ArrowLeft, Home, BookOpen } from 'lucide-react'
import { Button } from '@civicsense/ui-web/components/ui/button'
import { Badge } from '@civicsense/ui-web/components/ui/badge'

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sandbox Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/sandbox">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Sandbox
                </Button>
              </Link>
              
              <div className="hidden sm:block h-4 w-px bg-gray-300" />
              
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                🧪 Development Environment
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to App
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => window.open('http://localhost:6006', '_blank')}
              >
                <BookOpen className="h-4 w-4" />
                Storybook
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sandbox Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Sandbox Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>CivicSense Sandbox</span>
              <span>•</span>
              <span>Development Environment</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span>All content excluded from version control</span>
              <span>•</span>
              <Link href="/sandbox" className="hover:text-gray-700">
                View All Demos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 