"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface TopicSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  variant?: 'modal' | 'dropdown'
}

export function TopicSearch({ searchQuery, onSearchChange, variant = 'modal' }: TopicSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when menu opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    onSearchChange('') // Clear search when closing
  }

  if (variant === 'dropdown') {
    return (
      <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-lg px-3 py-2 font-light transition-colors"
      >
        <Search className="mr-3 h-4 w-4" />
        <span>Search Topics</span>
        </button>
        
        {/* Search Modal for dropdown variant - rendered outside button */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={(e) => e.stopPropagation()}>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
              onClick={handleClose}
            />
            
            {/* Search Menu */}
            <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <Search className="text-slate-400 dark:text-slate-500 h-5 w-5 mr-3" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  onClick={handleClose}
                  className="ml-3 p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Results/Instructions */}
              <div className="p-4">
                {searchQuery ? (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Searching for "{searchQuery}"...
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Start typing to search through topics and categories
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Search topics"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          {/* Search Menu */}
          <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <Search className="text-slate-400 dark:text-slate-500 h-5 w-5 mr-3" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                onClick={handleClose}
                className="ml-3 p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search Results/Instructions */}
            <div className="p-4">
              {searchQuery ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Searching for "{searchQuery}"...
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Start typing to search through topics and categories
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
