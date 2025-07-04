import React from 'react'

interface AutoReadPageProps {
  children: React.ReactNode
}

export function AutoReadPage({ children }: AutoReadPageProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {children}
    </div>
  )
} 