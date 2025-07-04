"use client"

import type React from "react"
import { Button } from './ui/button'

interface MockGameWrapperProps {
  gameName: string
  onComplete: () => void
  children: React.ReactNode
}

export function MockGameWrapper({ gameName, onComplete, children }: MockGameWrapperProps) {
  return (
    <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner h-full flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">{gameName}</h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
      </div>
      <Button onClick={onComplete} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white rounded-xl">
        Complete Quiz
      </Button>
    </div>
  )
}
