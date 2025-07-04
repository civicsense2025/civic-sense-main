"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  School, 
  Users, 
  Plus, 
  RefreshCw, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  BookOpen,
  UserPlus,
  Settings,
  Download,
  Upload,
  Eye,
  Shield,
  Zap
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { useAuth } from "../../components/ui"
import { useToast } from "../../components/ui"

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

interface GoogleClassroomPodCreatorProps {
  className?: string
}

export function GoogleClassroomPodCreator({ className }: GoogleClassroomPodCreatorProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Google Classroom state
  const [courses, setCourses] = useState<GoogleClassroomCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<GoogleClassroomCourse | null>(null)
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)

  // Pod creation state
  const [podConfig, setPodConfig] = useState({
    podName: '',
    podType: 'classroom' as const,
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
  const [activeTab, setActiveTab] = useState('courses')

  // Load Google Classroom courses
  useEffect(() => {
    loadClassroomCourses()
  }, [])

  // Auto-fill pod name when course is selected
  useEffect(() => {
    if (selectedCourse && !podConfig.podName) {
      const podName = selectedCourse.section 
        ? `${selectedCourse.name} - ${selectedCourse.section}`
        : selectedCourse.name
      setPodConfig(prev => ({ ...prev, podName }))
    }
  }, [selectedCourse, podConfig.podName])

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
    setActiveTab('configure')
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

    // Debug authentication state
    console.log('Creating pod - Auth state:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    })

    try {
      setProgress({
        step: 'creating',
        message: 'Creating learning pod...',
        progress: 50
      })

      // Step 1: Create the learning pod
      const podResponse = await fetch('/api/learning-pods', {
        method: 'POST',
        credentials: 'include', // Include authentication cookies
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
      console.log('Pod creation response:', podData)
      
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
          credentials: 'include', // Include authentication cookies
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
        
        const rosterData = await rosterResponse.json()
        console.log('Roster import response:', rosterData)
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
          credentials: 'include', // Include authentication cookies
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
        } else {
          const inviteData = await inviteResponse.json()
          console.log('Invite sending response:', inviteData)
        }
      }

      setProgress({
        step: 'complete',
        message: 'Learning pod created successfully!',
        progress: 100
      })

      setActiveTab('complete')

      toast({
        title: "Pod created successfully!",
        description: `${podConfig.podName} is ready with ${roster.length} students.`,
      })

      // Redirect to the new pod
      window.location.href = `/pods/${podId}`

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
    }
  }

  const getProgressIcon = () => {
    switch (progress.step) {
      case 'complete': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'selecting': return <School className="h-5 w-5 text-blue-600" />
      case 'configuring': return <Settings className="h-5 w-5 text-blue-600" />
      case 'creating': return <Plus className="h-5 w-5 text-blue-600" />
      case 'importing': return <Upload className="h-5 w-5 text-blue-600" />
      case 'inviting': return <Mail className="h-5 w-5 text-blue-600" />
      default: return <Clock className="h-5 w-5 text-slate-600" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <School className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-light text-slate-900 dark:text-white">
            Create Pod from Google Classroom
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
          Transform your Google Classroom course into a collaborative learning pod with automatic roster sync and student invitations.
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {getProgressIcon()}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900 dark:text-white">
                  {progress.message}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          </div>
          {progress.errors && progress.errors.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {progress.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses" disabled={progress.step !== 'selecting'}>
            1. Select Course
          </TabsTrigger>
          <TabsTrigger value="configure" disabled={!selectedCourse}>
            2. Configure Pod
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!selectedCourse || !podConfig.podName}>
            3. Review & Create
          </TabsTrigger>
          <TabsTrigger value="complete" disabled={progress.step !== 'complete'}>
            4. Complete
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Select Google Classroom Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCourses ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading your courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <School className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No courses found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Make sure you have teaching access to Google Classroom courses.
                  </p>
                  <Button onClick={loadClassroomCourses} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Courses
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Card 
                      key={course.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        selectedCourse?.id === course.id && "ring-2 ring-blue-600"
                      )}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-slate-900 dark:text-white line-clamp-2">
                              {course.name}
                            </h4>
                            <Badge variant="secondary" className="ml-2">
                              {course.courseState}
                            </Badge>
                          </div>
                          
                          {course.section && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {course.section}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Users className="h-4 w-4" />
                              {course.studentCount} students
                            </div>
                            {course.enrollmentCode && (
                              <code className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure" className="space-y-6">
          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configure Learning Pod
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Pod Name</Label>
                  <Input
                    value={podConfig.podName}
                    onChange={(e) => setPodConfig(prev => ({ ...prev, podName: e.target.value }))}
                    placeholder="Enter pod name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content Filter Level</Label>
                  <Select 
                    value={podConfig.contentFilterLevel} 
                    onValueChange={(value) => setPodConfig(prev => ({ ...prev, contentFilterLevel: value as any }))}
                  >
                    <SelectTrigger>
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

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Integration Options</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-sync roster</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Automatically import students from Google Classroom
                    </p>
                  </div>
                  <Switch
                    checked={podConfig.autoSync}
                    onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, autoSync: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Send invitation emails</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Email students with pod join instructions
                    </p>
                  </div>
                  <Switch
                    checked={podConfig.sendInvites}
                    onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, sendInvites: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require parent consent</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Send consent forms to parents for underage students
                    </p>
                  </div>
                  <Switch
                    checked={podConfig.requireParentConsent}
                    onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, requireParentConsent: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable classroom integration</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Sync grades and assignments back to Google Classroom
                    </p>
                  </div>
                  <Switch
                    checked={podConfig.classroomIntegration}
                    onCheckedChange={(checked) => setPodConfig(prev => ({ ...prev, classroomIntegration: checked }))}
                  />
                </div>
              </div>

              {isLoadingRoster && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Loading course roster...</p>
                </div>
              )}

              {roster.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Course Roster Preview</Label>
                    <Badge variant="secondary">{roster.length} students</Badge>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {roster.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {student.profile.name.fullName}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {student.profile.emailAddress}
                          </p>
                        </div>
                        <Badge variant={student.enrollmentStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                          {student.enrollmentStatus}
                        </Badge>
                      </div>
                    ))}
                    {roster.length > 5 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        ... and {roster.length - 5} more students
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={() => setActiveTab('review')} className="flex-1">
                  Continue to Review
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('courses')}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card className="border-0 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review & Create Pod
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedCourse && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Course Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Course Name:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{selectedCourse.name}</p>
                      </div>
                      {selectedCourse.section && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Section:</span>
                          <p className="font-medium text-slate-900 dark:text-white">{selectedCourse.section}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Students:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{roster.length}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <Badge variant="secondary">{selectedCourse.courseState}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Pod Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Pod Name:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{podConfig.podName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Content Filter:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{podConfig.contentFilterLevel}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Auto-sync:</span>
                        <Badge variant={podConfig.autoSync ? 'default' : 'secondary'}>
                          {podConfig.autoSync ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Send Invites:</span>
                        <Badge variant={podConfig.sendInvites ? 'default' : 'secondary'}>
                          {podConfig.sendInvites ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Ready to create your learning pod!</strong>
                      <br />
                      This will create a new learning pod and {podConfig.autoSync ? `import ${roster.length} students` : 'set up the pod structure'}. 
                      {podConfig.sendInvites && ' Invitation emails will be sent to all students.'}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Button 
                      onClick={createPodFromCourse} 
                      className="flex-1"
                      disabled={!selectedCourse || !podConfig.podName || progress.step === 'creating' || progress.step === 'importing' || progress.step === 'inviting'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {progress.step === 'creating' || progress.step === 'importing' || progress.step === 'inviting' ? 'Creating...' : 'Create Learning Pod'}
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('configure')} disabled={progress.step === 'creating' || progress.step === 'importing' || progress.step === 'inviting'}>
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete" className="space-y-6">
          <Card className="border-0 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-2">
                Learning Pod Created Successfully!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your Google Classroom course has been transformed into a collaborative learning pod.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-slate-900 dark:text-white">{roster.length}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Students Imported</p>
                </div>
                <div className="text-center">
                  <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-slate-900 dark:text-white">
                    {podConfig.sendInvites ? roster.length : 0}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Invites Sent</p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium text-slate-900 dark:text-white">{podConfig.contentFilterLevel}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Filter Level</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <a href={`/pods/${createdPodId}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Pod
                  </a>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Create Another Pod
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 