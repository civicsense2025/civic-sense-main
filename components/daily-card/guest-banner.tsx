"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

interface GuestBannerProps {
  summary: {
    hasReachedLimit: boolean
    remaining: number
    total: number
  }
  className?: string
}

export function GuestBanner({ summary, className }: GuestBannerProps) {
  const { user } = useAuth()
  
  // Only show for guests
  if (user) return null
  
  return (
    <div className={cn("mb-4 text-center", className)}>
      <div 
        className={cn(
          "px-4 py-3 rounded-lg border animate-in fade-in duration-300",
          summary.hasReachedLimit 
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
        )}
      >
        <p className="text-sm font-medium">
          {summary.hasReachedLimit 
            ? "Thanks for exploring CivicSense! Create a free account or support us for unlimited access."
            : `Free access: ${summary.remaining} of ${summary.total} remaining today`
          }
        </p>
        
        {!summary.hasReachedLimit && (
          <div className="mt-2 w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${((summary.total - summary.remaining) / summary.total) * 100}%` 
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
} 