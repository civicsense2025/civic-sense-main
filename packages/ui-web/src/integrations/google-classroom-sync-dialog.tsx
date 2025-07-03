"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { 
  School, 
  Users, 
  Plus, 
  RefreshCw, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings
} from 'lucide-react'
import { cn } from '../../utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from "../components/ui/use-toast"

interface GoogleClassroomCourse {
  id: string
  name: string
  section?: string
  descriptionHeading?: string
  enrollmentCode?: string
  courseState: string
  teacherFolder?: {
    id: string
    title: string
  }
  studentCount: number
  creationTime: string
}

interface RosterStudent {
  id: string
  profile: {
    id: string
    name: {
      fullName: string
      givenName: string
      familyName: string
    }
    emailAddress: string
    photoUrl?: string
  }
  enrollmentStatus: 'ACTIVE' | 'INACTIVE'
}

interface PodCreationProgress {
  step: 'selecting' | 'configuring' | 'creating' | 'importing' | 'inviting' | 'complete'
  message: string
  progress: number
  errors?: string[]
}

interface GoogleClassroomSyncDialogProps {
  /** Trigger button content */
  children: React.ReactNode
  /** Callback when pod is created successfully */
  onPodCreated?: (podId: string) => void
  /** Optional className for trigger */
  className?: string
}

export function GoogleClassroomSyncDialog({ 
  children, 
  onPodCreated, 
  className 
}: GoogleClassroomSyncDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Popover state
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'courses' | 'configure' | 'creating'>('courses')

  // Google Classroom state
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<GoogleClassroomCourse | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)

  // Pod creation state
  const [podConfig, setPodConfig] = useState({
    podName: '',
    contentFilterLevel: 'moderate' as const,
    autoSync: true,
    sendInvites: true,
    requireParentConsent: false,
    classroomIntegration: true
  })
  
  const [progress, setProgress] = useState<PodCreationProgress>({
    step: 'selecting',
    message: 'Select a Google Classroom course',
    progress: 0
  })

  const [createdPodId, setCreatedPodId] = useState<string | null>(null)

  // Handle authentication and course loading
  const handleOpenDialog = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to sync with Google Classroom.",
        variant: "destructive"
      })
      return
    }

    try {
      // Check if already authenticated
      const authResponse = await fetch('/api/integrations/classroom/test-auth')
      const authData = await authResponse.json()
      
      if (authResponse.status === 401 || !authData.authenticated) {
        // Need to authenticate - redirect to OAuth and return early
        toast({
          title: "Google Authentication Required",
          description: "Redirecting to Google to sign in to Classroom...",
        })
        
        // Redirect to Google OAuth with current URL as state parameter
        if (authData.authUrl) {
          // Add current URL as state parameter for redirect after auth
          const authUrl = new URL(authData.authUrl)
          authUrl.searchParams.set('state', window.location.href)
          window.location.href = authUrl.toString()
        } else {
          // Fallback to callback endpoint
          window.location.href = '/api/integrations/classroom/oauth/callback'
        }
        return
      }

      // Already authenticated, open dialog and load courses
      setOpen(true)
      setProgress({
        step: 'selecting',
        message: 'Loading your Google Classroom courses...',
        progress: 10
      })
      loadClassroomCourses()
    } catch (error) {
      console.error('Error checking Google Classroom auth:', error)
      toast({
        title: "Authentication Error",
        description: "Failed to connect to Google Classroom. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Load courses when dialog opens (for already authenticated users)
  useEffect(() => {
    if (open && courses.length === 0) {
      loadClassroomCourses()
    }
  }, [open])

  // Auto-fill pod name when course is selected
  useEffect(() => {
    if (selectedCourse && !podConfig.podName) {
      const podName = selectedCourse.section 
        ? `${selectedCourse.name} - ${selectedCourse.section}`
        : selectedCourse.name
      setPodConfig(prev => ({ ...prev, podName }))
    }
  }, [selectedCourse, podConfig.podName])

  // Auto-open dialog after successful Google OAuth authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('google_classroom_auth') === 'success') {
      // Remove the parameter from URL
      urlParams.delete('google_classroom_auth')
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
      window.history.replaceState({}, '', newUrl)
      
      // Open the dialog automatically
      if (!open) {
        setOpen(true)
        setProgress({
          step: 'selecting',
          message: 'Loading your Google Classroom courses...',
          progress: 10
        })
        loadClassroomCourses()
      }
    }
  }, [])

  const loadClassroomCourses = async () => {
    try {
      setIsLoadingCourses(true)
      const response = await fetch('/api/integrations/classroom/courses')
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
        
        if (data.courses && data.courses.length > 0) {
          setProgress({
            step: 'selecting',
            message: `Found ${data.courses.length} course${data.courses.length !== 1 ? 's' : ''} available`,
            progress: 20
          })
        } else {
          setProgress({
            step: 'selecting',
            message: 'No courses found. Make sure you have teaching access to Google Classroom courses.',
            progress: 0,
            errors: ['No courses available']
          })
        }
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to load courses: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error loading Google Classroom courses:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized')
      const isPermissionError = errorMessage.includes('403') || errorMessage.includes('Forbidden')
      
      setProgress({
        step: 'selecting',
        message: 'Error loading courses',
        progress: 0,
        errors: [
          isAuthError 
            ? 'Authentication required. Please sign in to Google Classroom.'
            : isPermissionError
            ? 'Permission denied. Make sure you have teaching access to Google Classroom.'
            : `Connection failed: ${errorMessage}`
        ]
      })
      
      toast({
        title: "Google Classroom Connection Failed",
        description: isAuthError 
          ? "Please sign in to Google Classroom and try again."
          : isPermissionError
          ? "Make sure you have teaching access to Google Classroom courses."
          : `Error: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const loadCourseRoster = async (courseId: string) => {
    try {
      setIsLoadingRoster(true)
      const response = await fetch(`/api/integrations/classroom/courses/${courseId}/roster`)
      
      if (response.ok) {
        const data = await response.json()
        setRoster(data.students || [])
        setProgress({
          step: 'configuring',
          message: `Loaded ${data.students?.length || 0} students from course roster`,
          progress: 40
        })
      } else {
        throw new Error('Failed to load roster')
      }
    } catch (error) {
      console.error('Error loading roster:', error)
      toast({
        title: "Error loading roster",
        description: "Could not load student roster for this course.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingRoster(false)
    }
  }

  const handleCourseSelect = (course: GoogleClassroomCourse) => {
    setSelectedCourse(course)
    setStep('configure')
    loadCourseRoster(course.id)
  }

  const createPodFromCourse = async () => {
    if (!selectedCourse || !podConfig.podName.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a course and enter a pod name.",
        variant: "destructive"
      })
      return
    }

    try {
      setStep('creating')
      setProgress({
        step: 'creating',
        message: 'Creating learning pod...',
        progress: 50
      })

      // Step 1: Create the learning pod
      const podResponse = await fetch('/api/learning-pods', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: podConfig.podName,
          podType: 'classroom',
          description: `Learning pod for ${selectedCourse.name}`,
          contentFilterLevel: podConfig.contentFilterLevel,
          classroomCourseId: selectedCourse.id,
          classroomCourseName: selectedCourse.name,
          classroomSection: selectedCourse.section
        })
      })

      if (!podResponse.ok) {
        const errorText = await podResponse.text()
        console.error('Pod creation failed:', podResponse.status, errorText)
        throw new Error(`Failed to create pod: ${podResponse.status}`)
      }

      const podData = await podResponse.json()
      
      if (!podData.success) {
        throw new Error(podData.error || 'Pod creation was not successful')
      }
      
      const podId = podData.podId
      setCreatedPodId(podId)

      setProgress({
        step: 'importing',
        message: 'Importing student roster...',
        progress: 70
      })

      // Step 2: Import the roster if enabled
      if (podConfig.autoSync && roster.length > 0) {
        const rosterResponse = await fetch(`/api/learning-pods/${podId}/import-roster`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourse.id,
            students: roster.map(student => ({
              googleId: student.profile.id,
              email: student.profile.emailAddress,
              fullName: student.profile.name.fullName,
              givenName: student.profile.name.givenName,
              familyName: student.profile.name.familyName,
              photoUrl: student.profile.photoUrl
            })),
            requireParentConsent: podConfig.requireParentConsent
          })
        })

        if (!rosterResponse.ok) {
          const errorText = await rosterResponse.text()
          console.error('Roster import failed:', rosterResponse.status, errorText)
          throw new Error(`Failed to import roster: ${rosterResponse.status}`)
        }
      }

      setProgress({
        step: 'inviting',
        message: 'Sending invitation emails...',
        progress: 85
      })

      // Step 3: Send invites if enabled
      if (podConfig.sendInvites && roster.length > 0) {
        const inviteResponse = await fetch(`/api/learning-pods/${podId}/send-invites`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourse.id,
            courseName: selectedCourse.name,
            students: roster.map(s => ({
              email: s.profile.emailAddress,
              name: s.profile.name.givenName
            })),
            requireParentConsent: podConfig.requireParentConsent
          })
        })

        if (!inviteResponse.ok) {
          const errorText = await inviteResponse.text()
          console.warn('Failed to send some invites:', inviteResponse.status, errorText)
        }
      }

      setProgress({
        step: 'complete',
        message: 'Learning pod created successfully!',
        progress: 100
      })

      toast({
        title: "Pod created successfully!",
        description: `${podConfig.podName} is ready with ${roster.length} students.`,
      })

      // Close popover and call callback
      setTimeout(() => {
        setOpen(false)
        onPodCreated?.(podId)
        
        // Reset state for next use
        setStep('courses')
        setSelectedCourse(null)
        setRoster([])
        setPodConfig({
          podName: '',
          contentFilterLevel: 'moderate',
          autoSync: true,
          sendInvites: true,
          requireParentConsent: false,
          classroomIntegration: true
        })
        setProgress({
          step: 'selecting',
          message: 'Select a Google Classroom course',
          progress: 0
        })
      }, 2000)

    } catch (error) {
      console.error('Error creating pod:', error)
      setProgress({
        step: 'selecting',
        message: 'Error creating pod',
        progress: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
      toast({
        title: "Error creating pod",
        description: "Please try again or contact support.",
        variant: "destructive"
      })
      setStep('courses')
    }
  }

  const getProgressIcon = () => {
    switch (progress.step) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'selecting': return <School className="h-4 w-4 text-blue-600" />
      case 'configuring': return <Settings className="h-4 w-4 text-blue-600" />
      case 'creating': return <Plus className="h-4 w-4 text-blue-600" />
      case 'importing': return <Users className="h-4 w-4 text-blue-600" />
      case 'inviting': return <Mail className="h-4 w-4 text-blue-600" />
      default: return <Clock className="h-4 w-4 text-slate-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className={className} onClick={handleOpenDialog}>
        {children}
      </Button>
      <DialogContent className="w-96 p-0 max-w-lg">
        <DialogTitle className="sr-only">
          Sync with Google Classroom
        </DialogTitle>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <School className="h-5 w-5 text-blue-600" />
              Sync with Google Classroom
            </CardTitle>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-3 mt-3">
              {getProgressIcon()}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {progress.message}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {progress.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            {progress.errors && progress.errors.length > 0 && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {progress.errors[0]}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 'courses' && (
              <div className="space-y-4">
                {isLoadingCourses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading your courses...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <School className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No courses found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Make sure you have teaching access to Google Classroom courses.
                    </p>
                    <Button onClick={loadClassroomCourses} variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {courses.map((course) => (
                      <Card 
                        key={course.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border",
                          selectedCourse?.id === course.id && "ring-2 ring-blue-600"
                        )}
                        onClick={() => handleCourseSelect(course)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                                {course.name}
                              </h4>
                              <Badge variant="secondary" className="text-xs ml-2">
                                {course.courseState}
                              </Badge>
                            </div>
                            
                            {course.section && (
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {course.section}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <Users className="h-3 w-3" />
                                {course.studentCount} students
                              </div>
                              {course.enrollmentCode && (
                                <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                                  {course.enrollmentCode}
                                </code>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'configure' && selectedCourse && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Pod Name</Label>
                    <Input
                      value={podConfig.podName}
                      onChange={(e) => setPodConfig(prev => ({ ...prev, podName: e.target.value }))}
                      placeholder="Enter pod name"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm">Content Filter Level</Label>
                    <Select 
                      value={podConfig.contentFilterLevel} 
                      onValueChange={(value) => setPodConfig(prev => ({ ...prev, contentFilterLevel: value as any }))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">🟡 Light - Basic filtering</SelectItem>
                        <SelectItem value="moderate">🔵 Moderate - Balanced protection</SelectItem>
                        <SelectItem value="strict">🟢 Strict - Maximum protection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">Integration Options</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Auto-sync roster</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Import students from Google Classroom
                      </p>
                    </div>
                    <Switch
                      checked={podConfig.autoSync}
                      onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, autoSync: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Send invitation emails</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Email students with join instructions
                      </p>
                    </div>
                    <Switch
                      checked={podConfig.sendInvites}
                      onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, sendInvites: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Require parent consent</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Send consent forms to parents
                      </p>
                    </div>
                    <Switch
                      checked={podConfig.requireParentConsent}
                      onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, requireParentConsent: checked }))}
                    />
                  </div>
                </div>

                {isLoadingRoster && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">Loading course roster...</p>
                  </div>
                )}

                {roster.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Course Roster Preview</Label>
                      <Badge variant="secondary" className="text-xs">{roster.length} students</Badge>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      {roster.slice(0, 3).map((student) => (
                        <div key={student.id} className="flex items-center gap-2 text-xs">
                          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Users className="h-2 w-2 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {student.profile.name.fullName}
                            </p>
                          </div>
                          <Badge variant={student.enrollmentStatus === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                            {student.enrollmentStatus}
                          </Badge>
                        </div>
                      ))}
                      {roster.length > 3 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          ... and {roster.length - 3} more students
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={createPodFromCourse} 
                    className="flex-1 text-sm h-8"
                    disabled={!selectedCourse || !podConfig.podName || progress.step === 'creating' || progress.step === 'importing' || progress.step === 'inviting'}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {progress.step === 'creating' || progress.step === 'importing' || progress.step === 'inviting' ? 'Creating...' : 'Create Pod'}
                  </Button>
                  <Button variant="outline" onClick={() => setStep('courses')} size="sm" className="text-sm h-8">
                    Back
                  </Button>
                </div>
              </div>
            )}

            {step === 'creating' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Creating Learning Pod
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Setting up your Google Classroom integration...
                </p>
                
                {progress.step === 'complete' && (
                  <div className="mt-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-600">
                      Pod created successfully!
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 