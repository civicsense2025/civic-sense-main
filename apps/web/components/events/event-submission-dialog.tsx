'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { format } from 'date-fns'
import { useToast } from "../../components/ui"

interface EventSubmissionDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
}

export function EventSubmissionDialog({ isOpen, onClose, selectedDate }: EventSubmissionDialogProps) {
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !url) return
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          eventDate: format(selectedDate, 'yyyy-MM-dd')
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit event')
      }
      
      toast({
        title: 'Event submitted',
        description: 'Your event has been submitted for review.',
      })
      
      setUrl('')
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit event. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Historical Event</DialogTitle>
          <DialogDescription>
            Submit a URL to a historical event for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'selected date'}.
            Our team will review and add it to the calendar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Event URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/historical-event"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 