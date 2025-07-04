import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CreatePodWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (podId: string) => void
}

export function CreatePodWizard({ isOpen, onClose, onSuccess }: CreatePodWizardProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Learning Pod</DialogTitle>
        </DialogHeader>
        {/* Placeholder for wizard steps */}
        <div className="p-4">
          <p>Pod creation wizard coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 