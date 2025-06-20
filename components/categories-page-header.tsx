"use client"

import Link from "next/link"
import { UserMenu } from "@/components/auth/user-menu"

export function CategoriesPageHeader() {
  return (
    <div className="border-b border-slate-100 dark:border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="group hover:opacity-70 transition-opacity"
          >
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
              CivicSense
            </h1>
          </Link>
          
          <UserMenu />
        </div>
      </div>
    </div>
  )
} 