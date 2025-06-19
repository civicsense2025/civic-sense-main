"use client"

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  items: TOCItem[]
  className?: string
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0% -70% 0%'
      }
    )

    items.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      items.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [items])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Header height
      const y = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top: y, behavior: 'smooth' })
      
      // Close mobile menu after clicking
      if (isMobile) {
        setIsOpen(false)
      }
    }
  }

  if (items.length === 0) return null

  // Mobile floating button and drawer
  if (isMobile) {
    return (
      <>
        {/* Floating TOC Button */}
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg",
            "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
            "border border-slate-200 dark:border-slate-700",
            "transition-transform duration-200 hover:scale-105"
          )}
          size="icon"
          variant="outline"
        >
          <List className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>

        {/* Mobile TOC Drawer */}
        <div
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-300",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Drawer */}
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900",
              "shadow-2xl transition-transform duration-300 ease-out",
              "border-l border-slate-200 dark:border-slate-800",
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Table of Contents
              </h3>
              <Button
                onClick={() => setIsOpen(false)}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        activeId === item.id
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      {item.level > 2 && (
                        <ChevronRight className="h-3 w-3 opacity-40" />
                      )}
                      <span className="line-clamp-2">{item.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </>
    )
  }

  // Desktop sticky sidebar
  return (
    <nav
      className={cn(
        "h-fit max-h-[calc(100vh-6rem)] overflow-y-auto",
        "w-64 p-4 rounded-xl",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
        "border border-slate-200 dark:border-slate-800",
        "shadow-sm",
        className
      )}
    >
      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4">
        On this page
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={cn(
                "block py-1.5 px-3 rounded-md text-sm transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                activeId === item.id
                  ? "bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
} 