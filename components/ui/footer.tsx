"use client"

import Link from "next/link"
import { PWAInstallButton } from "@/components/pwa-install-button"
import { LanguageSwitcher } from "../language-switcher"
import { ThemeToggle } from "../theme-toggle"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 sm:mb-2">
                CivicSense
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                Your daily dose of civic engagement
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isDevelopment && <LanguageSwitcher variant="compact" />}
              <ThemeToggle />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              © {currentYear} CivicSense. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link 
                href="/changelog" 
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                What's New
              </Link>
              <Link 
                href="/privacy" 
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/donate" 
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
              >
                Donate
              </Link>
              <PWAInstallButton 
                variant="outline" 
                size="sm" 
                className="ml-1 sm:ml-2 hidden sm:flex" 
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 