"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CleverShareButtonProps {
  topicId: string
  topicTitle: string
  description?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
}

/**
 * Clever Share Button Component
 * 
 * Creates a shareable assignment in Clever that links to a CivicSense quiz.
 * Note: Clever doesn't have a direct share API like Google Classroom,
 * so this component helps teachers create assignments manually.
 */
export function CleverShareButton({
  topicId,
  topicTitle,
  description,
  className,
  variant = 'outline',
  size = 'sm',
  disabled = false
}: CleverShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const shareToClever = async () => {
    if (disabled || isSharing) return

    try {
      setIsSharing(true)

      // Create the assignment URL with Clever tracking parameters
      const assignmentUrl = `${window.location.origin}/quiz/${topicId}?source=clever&utm_source=clever&utm_medium=assignment`
      
      // Generate assignment instructions for teachers
      const assignmentInstructions = `
**CivicSense Quiz Assignment: ${topicTitle}**

${description || 'Complete this civic education quiz to test your knowledge and understanding.'}

**Instructions for students:**
1. Click the link to access the CivicSense quiz
2. Complete all questions to the best of your ability
3. Review explanations after each question to learn
4. Submit your completed quiz for grading

**Assignment Link:** ${assignmentUrl}

**About CivicSense:** This quiz is powered by CivicSense, a civic education platform that helps students understand how government and democracy work in practice.
      `.trim()

      // Copy assignment details to clipboard
      await navigator.clipboard.writeText(assignmentInstructions)

      // Open Clever portal in new tab (teachers can create assignment manually)
      const cleverUrl = 'https://clever.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=read:sections%20read:students%20write:assignments'
      
      // For now, show an alert with instructions since Clever doesn't have direct share API
      alert(`Assignment details copied to clipboard! 

To create this assignment in Clever:
1. Go to your Clever portal
2. Navigate to your section/class
3. Create a new assignment
4. Paste the copied content as the assignment description
5. Set due date and point value as needed

The assignment link will automatically track student completion.`)

      // In a real implementation, you might:
      // - Open a modal with detailed instructions
      // - Integrate with Clever's Assignment creation API if available
      // - Provide a form to help teachers create the assignment

    } catch (error) {
      console.error('Failed to share to Clever:', error)
      alert('Failed to prepare Clever assignment. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={shareToClever}
      disabled={disabled || isSharing}
      variant={variant}
      size={size}
      className={cn(
        "gap-2 transition-all duration-200",
        "hover:shadow-md hover:scale-105",
        "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
        className
      )}
      aria-label={`Share ${topicTitle} to Clever`}
    >
      <BookOpen className="h-4 w-4" />
      {isSharing ? 'Sharing...' : 'Share to Clever'}
    </Button>
  )
}

/**
 * Enhanced Clever Share Button with Assignment Creation Form
 */
interface CleverShareFormProps extends CleverShareButtonProps {
  onSuccess?: (assignmentId: string) => void
  onError?: (error: string) => void
}

export function CleverShareForm({
  topicId,
  topicTitle,
  description,
  onSuccess,
  onError,
  ...buttonProps
}: CleverShareFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({
    title: `CivicSense Quiz: ${topicTitle}`,
    description: description || `Complete this civic education quiz on ${topicTitle}`,
    dueDate: '',
    maxPoints: 100,
    sectionId: ''
  })

  const createCleverAssignment = async () => {
    try {
      setIsCreating(true)

      const response = await fetch('/api/integrations/clever/create-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: 'user-token', // Would come from OAuth
          section_id: form.sectionId,
          topic_id: topicId,
          title: form.title,
          description: form.description,
          due_date: form.dueDate || undefined,
          max_points: form.maxPoints
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess?.(data.assignmentId)
        setIsOpen(false)
        // Reset form
        setForm({
          title: `CivicSense Quiz: ${topicTitle}`,
          description: description || `Complete this civic education quiz on ${topicTitle}`,
          dueDate: '',
          maxPoints: 100,
          sectionId: ''
        })
      } else {
        throw new Error(data.error || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Failed to create Clever assignment:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to create assignment')
    } finally {
      setIsCreating(false)
    }
  }

  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create Clever Assignment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-md h-20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Section ID</label>
              <input
                type="text"
                value={form.sectionId}
                onChange={(e) => setForm(prev => ({ ...prev, sectionId: e.target.value }))}
                placeholder="Enter your Clever section ID"
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max Points</label>
                <input
                  type="number"
                  value={form.maxPoints}
                  onChange={(e) => setForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              onClick={createCleverAssignment}
              disabled={isCreating || !form.sectionId}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Assignment'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setIsOpen(true)}
      variant={buttonProps.variant}
      size={buttonProps.size}
      className={cn(
        "gap-2 transition-all duration-200",
        "hover:shadow-md hover:scale-105",
        "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
        buttonProps.className
      )}
      disabled={buttonProps.disabled}
    >
      <BookOpen className="h-4 w-4" />
      Share to Clever
    </Button>
  )
}

/**
 * Clever Assignment Link Generator
 * Generates standardized URLs for Clever assignments
 */
export function generateCleverAssignmentUrl(
  topicId: string,
  sectionId?: string,
  additionalParams?: Record<string, string>
): string {
  const baseUrl = `${window.location.origin}/quiz/${topicId}`
  const params = new URLSearchParams({
    source: 'clever',
    utm_source: 'clever',
    utm_medium: 'assignment',
    ...(sectionId && { clever_section: sectionId }),
    ...additionalParams
  })
  
  return `${baseUrl}?${params.toString()}`
}

export default CleverShareButton 