"use client"

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PodHeaderProps {
  onCreatePod: () => void
  onPodCreated: (podId: string) => void
}

export function PodHeader({ onCreatePod, onPodCreated }: PodHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-light text-slate-900 dark:text-white mb-2">Learning Pods</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Create and manage your learning communities
        </p>
      </div>
      <Button onClick={onCreatePod} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Pod
      </Button>
    </div>
  )
} 