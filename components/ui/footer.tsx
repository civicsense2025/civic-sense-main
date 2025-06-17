"use client"

import Link from "next/link"
import { PWAInstallButton } from "@/components/pwa-install-button"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col space-y-6">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              CivicSense
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Your daily dose of civic engagement
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600 dark:text-slate-400 space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              © {currentYear} CivicSense. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6">
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
                className="ml-2 hidden sm:flex" 
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 