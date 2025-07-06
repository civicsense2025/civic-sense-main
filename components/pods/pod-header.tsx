"use client"

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, School } from 'lucide-react'
import { GoogleClassroomSyncDialog } from '@/components/integrations/google-classroom-sync-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'

interface PodHeaderProps {
  onCreatePod: () => void
  onPodCreated: (podId: string) => void
}

export function PodHeader({ onCreatePod, onPodCreated }: PodHeaderProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const handleCreatePodClick = () => {
    if (user) {
      onCreatePod()
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to create learning pods.",
        variant: "destructive"
      })
    }
  }

  const handlePodCreated = (podId: string) => {
    toast({
      title: "Pod created from Google Classroom!",
      description: "Your classroom has been synced successfully.",
    })
    onPodCreated(podId)
  }

  return (
    <div className="text-center space-y-6 mb-16 sm:mb-20">
      <div className="flex items-center justify-center gap-4">
        <h1 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-white tracking-tight">
          My Pods
        </h1>
        
        {/* Mobile Actions Dropdown - Next to Title */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <span className="sr-only">Pod actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem
                onClick={handleCreatePodClick}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pod
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <GoogleClassroomSyncDialog
                  onPodCreated={handlePodCreated}
                  className="w-full justify-start p-2 h-auto font-normal bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-0"
                >
                  <School className="h-4 w-4 mr-2" />
                  Sync with Google Classroom
                </GoogleClassroomSyncDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-3xl mx-auto">
        Create and manage safe learning spaces for families, friends, classrooms, and organizations
      </p>
      
      {/* Action Buttons - Desktop */}
      <div className="hidden sm:flex justify-center items-center gap-4 pt-4">
        <Button 
          className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-8 py-3 h-12 font-light"
          onClick={handleCreatePodClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pod
        </Button>
        
        <GoogleClassroomSyncDialog
          onPodCreated={handlePodCreated}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 h-12 font-light border-0"
        >
          <School className="h-4 w-4 mr-2 text-white" />
          Sync with Google Classroom
        </GoogleClassroomSyncDialog>
      </div>
    </div>
  )
} 