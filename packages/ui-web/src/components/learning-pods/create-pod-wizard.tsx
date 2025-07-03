"use client"

import { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Heart, 
  Lightbulb, 
  BookOpen,
  Shield,
  Accessibility,
  Sparkles,
  Check,
  X
} from 'lucide-react'
import { cn } from '../../utils'
import { useToast } from "../components/ui/use-toast"
import { useAuth } from '@/components/auth/auth-provider'

interface CreatePodWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (podId: string) => void
}

interface PodFormData {
  podName: string
  podType: 'family' | 'friends' | 'classroom' | 'study_group' | 'campaign' | 'organization' | 'book_club' | 'debate_team' | 'custom'
  customTypeLabel: string
  familyName: string
  description: string
  contentFilterLevel: 'none' | 'light' | 'moderate' | 'strict'
  podEmoji: string
  podColor: string
  podMotto: string
  personalityType: '' | 'competitive' | 'collaborative' | 'exploratory' | 'structured'
  accessibilityMode: 'standard' | 'high_contrast' | 'sensory_friendly'
}

export function CreatePodWizard({ isOpen, onClose, onSuccess }: CreatePodWizardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<PodFormData>({
    podName: '',
    podType: 'family',
    customTypeLabel: '',
    familyName: '',
    description: '',
    contentFilterLevel: 'moderate',
    podEmoji: '',
    podColor: '#3b82f6',
    podMotto: '',
    personalityType: '',
    accessibilityMode: 'standard'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = useCallback((updates: Partial<PodFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.podName.trim()) return false
        if (formData.podType === 'custom' && !formData.customTypeLabel.trim()) return false
        return true
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a pod.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/learning-pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Pod created successfully!",
          description: `${formData.podName} is ready for collaborative learning.`,
        })
        onSuccess(data.podId)
        onClose()
      } else {
        throw new Error(data.error || 'Failed to create pod')
      }
    } catch (error) {
      console.error('Failed to create pod:', error)
      toast({
        title: "Error creating pod",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <CardHeader className="text-center border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-light">Create New Pod</CardTitle>
            <div className="w-10" />
          </div>
          
          <div className="space-y-2">
            <Progress value={(currentStep / 3) * 100} className="h-2" />
            <div className="flex justify-between text-sm text-slate-500">
              <span className={cn(currentStep >= 1 && "text-blue-600")}>Basics</span>
              <span className={cn(currentStep >= 2 && "text-blue-600")}>Customize</span>
              <span className={cn(currentStep >= 3 && "text-blue-600")}>Review</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2">Let's start with the basics</h3>
                <p className="text-slate-500 text-sm">Give your learning pod a name and choose its type</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pod Name *</Label>
                  <Input
                    value={formData.podName}
                    onChange={(e) => updateFormData({ podName: e.target.value })}
                    placeholder="Smith Family Learning Pod"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pod Type *</Label>
                  <Select value={formData.podType} onValueChange={(value) => updateFormData({ podType: value as any })}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                      <SelectItem value="friends">👥 Friends</SelectItem>
                      <SelectItem value="classroom">🏫 Classroom</SelectItem>
                      <SelectItem value="study_group">📚 Study Group</SelectItem>
                      <SelectItem value="custom">✨ Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.podType === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Type Label *</Label>
                    <Input
                      value={formData.customTypeLabel}
                      onChange={(e) => updateFormData({ customTypeLabel: e.target.value })}
                      placeholder="e.g., Community Group, Club, etc."
                      className="h-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Content Filter Level</Label>
                  <Select value={formData.contentFilterLevel} onValueChange={(value) => updateFormData({ contentFilterLevel: value as any })}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">🔓 None</SelectItem>
                      <SelectItem value="light">🟡 Light</SelectItem>
                      <SelectItem value="moderate">🔵 Moderate</SelectItem>
                      <SelectItem value="strict">🟢 Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Customize your pod
                </h3>
                <p className="text-slate-500 text-sm">Make your pod unique</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pod Emoji</Label>
                    <Input
                      value={formData.podEmoji}
                      onChange={(e) => updateFormData({ podEmoji: e.target.value.slice(0, 2) })}
                      placeholder="Choose an emoji..."
                      className="h-12"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pod Color</Label>
                    <input
                      type="color"
                      value={formData.podColor}
                      onChange={(e) => updateFormData({ podColor: e.target.value })}
                      className="w-full h-12 rounded border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pod Motto</Label>
                  <Input
                    value={formData.podMotto}
                    onChange={(e) => updateFormData({ podMotto: e.target.value })}
                    placeholder="Learning together, growing stronger"
                    className="h-12"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Review your pod
                </h3>
                <p className="text-slate-500 text-sm">Everything looks good? Let's create your learning pod!</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl border-2"
                    style={{ 
                      backgroundColor: `${formData.podColor}15`,
                      borderColor: formData.podColor
                    }}
                  >
                    {formData.podEmoji || '👥'}
                  </div>
                  <div>
                    <h4 className="text-xl font-medium">{formData.podName}</h4>
                    {formData.podMotto && (
                      <p className="text-sm text-slate-500 italic">"{formData.podMotto}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {formData.podType === 'custom' && formData.customTypeLabel 
                          ? formData.customTypeLabel 
                          : formData.podType
                        }
                      </Badge>
                      <Badge variant="outline">{formData.contentFilterLevel} filter</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              
              {currentStep < 3 ? (
                <Button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? 'Creating...' : 'Create Pod'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 