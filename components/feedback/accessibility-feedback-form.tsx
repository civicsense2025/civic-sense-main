"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Accessibility, 
  Send, 
  AlertTriangle, 
  Shield, 
  Heart,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AccessibilityFeedbackForm {
  assistiveTechnology: string[]
  primaryChallenge: string
  component: string
  issueType: string
  severity: 'blocker' | 'major' | 'minor' | 'enhancement'
  description: string
  civicLearningImpact: string
  suggestedSolution: string
  contactEmail?: string
  allowFollowUp: boolean
  pageUrl?: string
  browserInfo?: string
}

const ASSISTIVE_TECHNOLOGIES = [
  { id: 'screen_reader', label: 'Screen Reader (NVDA, JAWS, VoiceOver, etc.)' },
  { id: 'keyboard_only', label: 'Keyboard-only navigation' },
  { id: 'voice_control', label: 'Voice control software' },
  { id: 'switch_navigation', label: 'Switch navigation' },
  { id: 'magnification', label: 'Screen magnification' },
  { id: 'high_contrast', label: 'High contrast / Custom colors' },
  { id: 'reduced_motion', label: 'Reduced motion preferences' },
  { id: 'other', label: 'Other assistive technology' }
]

const CIVIC_COMPONENTS = [
  { id: 'quiz_engine', label: 'Quiz Questions & Answers' },
  { id: 'multiplayer_rooms', label: 'Multiplayer Civic Games' },
  { id: 'news_analysis', label: 'News & Bias Analysis' },
  { id: 'audio_content', label: 'Audio Content & Players' },
  { id: 'navigation', label: 'Site Navigation & Menus' },
  { id: 'dashboard', label: 'Progress Dashboard' },
  { id: 'settings', label: 'Accessibility Settings' },
  { id: 'forms', label: 'Forms & Input Fields' },
  { id: 'mobile_interface', label: 'Mobile Interface' },
  { id: 'other', label: 'Other Component' }
]

const ISSUE_TYPES = [
  { id: 'keyboard_access', label: 'Cannot access with keyboard' },
  { id: 'screen_reader', label: 'Screen reader issues' },
  { id: 'focus_management', label: 'Focus problems' },
  { id: 'contrast', label: 'Text contrast / visibility' },
  { id: 'audio_barriers', label: 'Audio accessibility barriers' },
  { id: 'motion_issues', label: 'Motion / animation problems' },
  { id: 'cognitive_load', label: 'Too complex / overwhelming' },
  { id: 'civic_learning_blocked', label: 'Prevents civic learning' },
  { id: 'timeout_issues', label: 'Time limits too short' },
  { id: 'other', label: 'Other accessibility issue' }
]

const PRIMARY_CHALLENGES = [
  'Blindness or low vision',
  'Deafness or hearing loss',
  'Motor disabilities',
  'Cognitive differences',
  'Multiple disabilities',
  'Temporary impairment',
  'Prefer not to say'
]

interface AccessibilityFeedbackProps {
  className?: string
  trigger?: React.ReactNode
  initialComponent?: string
  initialUrl?: string
}

export function AccessibilityFeedbackForm({ 
  className, 
  trigger,
  initialComponent,
  initialUrl
}: AccessibilityFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState<AccessibilityFeedbackForm>({
    assistiveTechnology: [],
    primaryChallenge: '',
    component: initialComponent || '',
    issueType: '',
    severity: 'major',
    description: '',
    civicLearningImpact: '',
    suggestedSolution: '',
    contactEmail: '',
    allowFollowUp: false,
    pageUrl: initialUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  })

  const updateForm = <K extends keyof AccessibilityFeedbackForm>(
    key: K,
    value: AccessibilityFeedbackForm[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleAssistiveTechChange = (techId: string, checked: boolean) => {
    if (checked) {
      updateForm('assistiveTechnology', [...form.assistiveTechnology, techId])
    } else {
      updateForm('assistiveTechnology', form.assistiveTechnology.filter(id => id !== techId))
    }
  }

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the accessibility issue you encountered.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, this would post to the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitted(true)
      toast({
        title: "Thank you for your feedback!",
        description: "Your accessibility report helps us build better civic education for everyone."
      })

      // Reset form after successful submission
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setForm({
          assistiveTechnology: [],
          primaryChallenge: '',
          component: '',
          issueType: '',
          severity: 'major',
          description: '',
          civicLearningImpact: '',
          suggestedSolution: '',
          contactEmail: '',
          allowFollowUp: false,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        })
      }, 2000)

    } catch (error) {
      console.error('Error submitting accessibility feedback:', error)
      toast({
        title: "Submission failed",
        description: "Please try again or contact support directly.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'blocker': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'major': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'minor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'enhancement': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <Accessibility className="h-4 w-4" />
      Report Accessibility Issue
    </Button>
  )

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-4">
              Your accessibility feedback helps us ensure everyone can participate in civic education.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <Heart className="h-4 w-4" />
              <span>Building democracy for everyone</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Report Accessibility Barrier
          </DialogTitle>
          <DialogDescription>
            Help us make CivicSense accessible to every citizen. Your feedback directly improves 
            civic education for people with disabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Your Voice Matters for Democracy</AlertTitle>
            <AlertDescription>
              When accessibility barriers block civic education, they block democratic participation. 
              Every report helps us build a more inclusive democracy.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Setup & Needs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  What assistive technology do you use? (Select all that apply)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ASSISTIVE_TECHNOLOGIES.map((tech) => (
                    <div key={tech.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tech.id}
                        checked={form.assistiveTechnology.includes(tech.id)}
                        onCheckedChange={(checked) => 
                          handleAssistiveTechChange(tech.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={tech.id} className="text-sm">
                        {tech.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Primary challenge (optional)
                </Label>
                <Select value={form.primaryChallenge} onValueChange={(value) => updateForm('primaryChallenge', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_CHALLENGES.map((challenge) => (
                      <SelectItem key={challenge} value={challenge}>
                        {challenge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Which part of CivicSense has the accessibility issue?
                </Label>
                <Select value={form.component} onValueChange={(value) => updateForm('component', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIVIC_COMPONENTS.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  What type of accessibility issue?
                </Label>
                <Select value={form.issueType} onValueChange={(value) => updateForm('issueType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  How much does this impact your civic learning?
                </Label>
                <RadioGroup 
                  value={form.severity} 
                  onValueChange={(value) => updateForm('severity', value as AccessibilityFeedbackForm['severity'])}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="blocker" id="blocker" />
                    <Label htmlFor="blocker" className="flex items-center gap-2">
                      <Badge className={getSeverityColor('blocker')}>Blocker</Badge>
                      Completely prevents me from learning
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="major" id="major" />
                    <Label htmlFor="major" className="flex items-center gap-2">
                      <Badge className={getSeverityColor('major')}>Major</Badge>
                      Makes civic learning very difficult
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minor" id="minor" />
                    <Label htmlFor="minor" className="flex items-center gap-2">
                      <Badge className={getSeverityColor('minor')}>Minor</Badge>
                      Causes some frustration but I can work around it
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enhancement" id="enhancement" />
                    <Label htmlFor="enhancement" className="flex items-center gap-2">
                      <Badge className={getSeverityColor('enhancement')}>Enhancement</Badge>
                      Would improve my experience
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  Describe the accessibility issue *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Please describe what you were trying to do, what happened, and what you expected to happen..."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="civicImpact" className="text-sm font-medium mb-2 block">
                  How does this affect your civic education?
                </Label>
                <Textarea
                  id="civicImpact"
                  placeholder="How does this barrier impact your ability to learn about government, politics, or participate in democracy?"
                  value={form.civicLearningImpact}
                  onChange={(e) => updateForm('civicLearningImpact', e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="suggestion" className="text-sm font-medium mb-2 block">
                  Suggested solution (optional)
                </Label>
                <Textarea
                  id="suggestion"
                  placeholder="If you have ideas about how to fix this issue, please share them..."
                  value={form.suggestedSolution}
                  onChange={(e) => updateForm('suggestedSolution', e.target.value)}
                  rows={2}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Follow-up (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowFollowUp"
                  checked={form.allowFollowUp}
                  onCheckedChange={(checked) => updateForm('allowFollowUp', checked as boolean)}
                />
                <Label htmlFor="allowFollowUp" className="text-sm">
                  I'm willing to help test accessibility improvements
                </Label>
              </div>

              {form.allowFollowUp && (
                <div>
                  <Label htmlFor="contactEmail" className="text-sm font-medium mb-2 block">
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={form.contactEmail}
                    onChange={(e) => updateForm('contactEmail', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll only contact you about this accessibility issue and testing opportunities.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Reports are reviewed within 48 hours. Critical issues are addressed immediately.
            </p>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !form.description.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 