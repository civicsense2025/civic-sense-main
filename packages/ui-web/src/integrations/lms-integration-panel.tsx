"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  GraduationCap,
  ExternalLink,
  CheckCircle,
  Settings,
  RefreshCw,
  Users,
  BookOpen,
  AlertTriangle,
  Plus,
  Calendar,
  BarChart3,
  Download
} from 'lucide-react'
import { cn } from '../../utils'
import { useToast } from '@civicsense/shared/hooks/use-toast'

interface LMSCourse {
  id: string
  name: string
  description?: string
  section?: string
  grade?: string
  subject?: string
  school?: string
  teacher?: string
  studentCount?: number
}

interface LMSAssignment {
  id: string
  title: string
  description: string
  topicId: string
  topicTitle?: string
  dueDate?: string
  maxPoints: number
  externalUrl?: string
  createdAt: string
}

interface LMSSyncLog {
  id: string
  syncType: string
  status: 'success' | 'error' | 'pending'
  recordsProcessed: number
  recordsSuccessful: number
  errorDetails?: any
  timestamp: string
}

type LMSPlatform = 'google_classroom' | 'clever' | null

interface LMSIntegrationPanelProps {
  podId: string
  podName: string
  lmsPlatform?: LMSPlatform
  googleClassroomId?: string
  cleverSectionId?: string
  syncEnabled?: boolean
  gradePassbackEnabled?: boolean
  lastSync?: string
  userRole: string
  onUpdate?: () => void
}

export function LMSIntegrationPanel({
  podId,
  podName,
  lmsPlatform,
  googleClassroomId,
  cleverSectionId,
  syncEnabled = false,
  gradePassbackEnabled = false,
  lastSync,
  userRole,
  onUpdate
}: LMSIntegrationPanelProps) {
  const { toast } = useToast()
  
  const [selectedPlatform, setSelectedPlatform] = useState<LMSPlatform>(lmsPlatform || null)
  const [courses, setCourses] = useState<LMSCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<LMSCourse | null>(null)
  const [assignments, setAssignments] = useState<LMSAssignment[]>([])
  const [syncLogs, setSyncLogs] = useState<LMSSyncLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  
  // Assignment creation form
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    topicId: '',
    dueDate: '',
    maxPoints: 100
  })

  // Check if user can manage LMS integration
  const canManage = ['admin', 'parent', 'organizer', 'teacher'].includes(userRole)

  // Get current integration status
  const isConnected = Boolean(
    (selectedPlatform === 'google_classroom' && googleClassroomId) ||
    (selectedPlatform === 'clever' && cleverSectionId)
  )

  const connectToLMS = async (platform: LMSPlatform) => {
    if (!canManage) {
      toast({
        title: "Permission denied",
        description: "Only teachers, organizers, parents, and admins can manage LMS integration.",
        variant: "destructive"
      })
      return
    }

    if (!platform) return

    try {
      setIsLoading(true)
      
      // In a real implementation, this would trigger OAuth flow
      toast({
        title: "OAuth Required",
        description: `${platform === 'google_classroom' ? 'Google Classroom' : 'Clever'} OAuth integration needs to be implemented.`,
        variant: "destructive"
      })
      
      // For demo purposes, show sample courses
      if (platform === 'google_classroom') {
        setCourses([
          {
            id: 'sample-course-1',
            name: 'Civics 101 - Fall 2024',
            description: 'Introduction to American Government and Civic Responsibility',
            section: 'Period 3',
            teacher: 'teacher-123',
            studentCount: 24
          },
          {
            id: 'sample-course-2', 
            name: 'AP Government - Fall 2024',
            description: 'Advanced Placement U.S. Government and Politics',
            section: 'Period 5',
            teacher: 'teacher-123',
            studentCount: 18
          }
        ])
      } else if (platform === 'clever') {
        setCourses([
          {
            id: 'sample-section-1',
            name: 'Government & Civics',
            description: 'High School Government Class',
            grade: '11',
            subject: 'Social Studies',
            school: 'Lincoln High School',
            studentCount: 28
          },
          {
            id: 'sample-section-2',
            name: 'AP Government',
            description: 'Advanced Placement Government',
            grade: '12',
            subject: 'Social Studies', 
            school: 'Lincoln High School',
            studentCount: 22
          }
        ])
      }
      
    } catch (error) {
      console.error('Failed to connect to LMS:', error)
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${platform === 'google_classroom' ? 'Google Classroom' : 'Clever'}.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const linkCourse = async (course: LMSCourse) => {
    try {
      setIsLoading(true)
      
      // Update pod with LMS integration
      const response = await fetch('/api/integrations/link-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podId,
          platform: selectedPlatform,
          courseId: course.id,
          courseName: course.name
        })
      })
      
      if (response.ok) {
        setSelectedCourse(course)
        toast({
          title: "Course linked successfully",
          description: `${course.name} is now connected to your learning pod.`,
        })
        onUpdate?.()
      } else {
        toast({
          title: "Failed to link course",
          description: "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to link course:', error)
      toast({
        title: "Failed to link course",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const syncRoster = async () => {
    try {
      setIsSyncing(true)
      
      const endpoint = selectedPlatform === 'google_classroom' 
        ? '/api/integrations/classroom/sync-roster'
        : '/api/integrations/clever/sync-roster'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: 'demo-token', // Would be real token
          pod_id: podId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Roster synced successfully",
          description: `Added ${data.totalAdded} members to the pod.`,
        })
        onUpdate?.()
      } else {
        toast({
          title: "Sync failed",
          description: data.error || "Failed to sync roster.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to sync roster:', error)
      toast({
        title: "Sync failed",
        description: "Failed to sync roster.",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const createAssignment = async () => {
    try {
      const endpoint = selectedPlatform === 'google_classroom'
        ? '/api/integrations/classroom/create-assignment'
        : '/api/integrations/clever/create-assignment'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: 'demo-token', // Would be real token
          ...(selectedPlatform === 'google_classroom' 
            ? { course_id: selectedCourse?.id }
            : { section_id: selectedCourse?.id }
          ),
          ...assignmentForm
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Assignment created",
          description: `${assignmentForm.title} has been created successfully.`,
        })
        setShowAssignmentForm(false)
        setAssignmentForm({
          title: '',
          description: '',
          topicId: '',
          dueDate: '',
          maxPoints: 100
        })
        // Refresh assignments list
        loadAssignments()
      } else {
        toast({
          title: "Failed to create assignment",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast({
        title: "Failed to create assignment",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const loadAssignments = async () => {
    if (!selectedCourse) return
    
    try {
      const endpoint = selectedPlatform === 'google_classroom'
        ? `/api/integrations/classroom/create-assignment?course_id=${selectedCourse.id}`
        : `/api/integrations/clever/create-assignment?section_id=${selectedCourse.id}`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Failed to load assignments:', error)
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      loadAssignments()
    }
  }, [selectedCourse, selectedPlatform])

  // If no platform is selected, show platform selection
  if (!isConnected && !selectedPlatform) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-light text-slate-900 dark:text-white">
            Learning Management System Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center space-y-6">
            <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Connect your learning pod to your school's LMS to automatically sync rosters and send quiz grades.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700"
                onClick={() => setSelectedPlatform('google_classroom')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Google Classroom
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                    Full integration with automatic grade passback to gradebook
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-700"
                onClick={() => setSelectedPlatform('clever')}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Clever
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                    Roster sync with internal grade tracking and reporting
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {!canManage && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only teachers, organizers, parents, and admins can set up LMS integration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // If platform is selected but not connected, show connection interface
  if (selectedPlatform && !isConnected) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
            {selectedPlatform === 'google_classroom' ? (
              <>
                <GraduationCap className="h-6 w-6" />
                Google Classroom Integration
              </>
            ) : (
              <>
                <BookOpen className="h-6 w-6" />
                Clever Integration
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedPlatform(null)}
                className="h-12"
              >
                Back to Platform Selection
              </Button>
              
              {canManage && (
                <Button 
                  onClick={() => connectToLMS(selectedPlatform)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 h-12 font-light"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect to {selectedPlatform === 'google_classroom' ? 'Google Classroom' : 'Clever'}
                </Button>
              )}
            </div>
            
            {/* Show available courses for selection */}
            {courses.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-light text-slate-900 dark:text-white">
                  Select a {selectedPlatform === 'google_classroom' ? 'Course' : 'Section'} to Link
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {course.name}
                          </h4>
                          {course.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                              {course.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <Users className="h-4 w-4" />
                              {course.studentCount} students
                            </div>
                            <Button
                              size="sm"
                              onClick={() => linkCourse(course)}
                              disabled={isLoading}
                              className="bg-slate-900 hover:bg-slate-800 text-white"
                            >
                              Link Course
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected interface
  return (
    <div className="space-y-8">
      {/* Connected Status */}
      <Card className="border-0 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  {selectedPlatform === 'google_classroom' ? 'Google Classroom' : 'Clever'} Connected
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {selectedCourse?.name || 'Connected to LMS'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {lastSync && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Last sync: {new Date(lastSync).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Management Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100 dark:bg-slate-800 h-12">
          <TabsTrigger value="overview" className="font-light">Overview</TabsTrigger>
          <TabsTrigger value="assignments" className="font-light">Assignments</TabsTrigger>
          <TabsTrigger value="grades" className="font-light">Grades</TabsTrigger>
          <TabsTrigger value="settings" className="font-light">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-light text-slate-900 dark:text-white mb-2">
                  {selectedCourse?.studentCount || 0}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light">Students</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-light text-slate-900 dark:text-white mb-2">
                  {assignments.length}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light">Assignments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-light text-slate-900 dark:text-white mb-2">
                  {syncEnabled ? 'Active' : 'Inactive'}
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-light">Sync Status</p>
              </CardContent>
            </Card>
          </div>

          {canManage && (
            <div className="flex gap-4">
              <Button
                onClick={syncRoster}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Sync Roster
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {canManage && (
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Assignments
              </h3>
              <Button
                onClick={() => setShowAssignmentForm(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>
          )}

          {showAssignmentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Quiz: Constitutional Rights"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic ID</Label>
                    <Input
                      value={assignmentForm.topicId}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, topicId: e.target.value }))}
                      placeholder="constitutional-rights"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Test your knowledge of constitutional rights and protections"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={assignmentForm.dueDate}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Points</Label>
                    <Input
                      type="number"
                      value={assignmentForm.maxPoints}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createAssignment}>
                    Create Assignment
                  </Button>
                  <Button variant="outline" onClick={() => setShowAssignmentForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {assignment.title}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                        {assignment.description}
                      </p>
                      {assignment.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {assignment.maxPoints} points
                      </Badge>
                      {assignment.externalUrl && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={assignment.externalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {assignments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    No assignments yet
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 font-light">
                    Create your first assignment to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Grade Management
            </h3>
            {selectedPlatform === 'clever' && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Grade Report
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Grade Analytics Coming Soon
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-light">
                {selectedPlatform === 'google_classroom' 
                  ? 'Grades are automatically synced to Google Classroom gradebook.'
                  : 'Internal grade tracking and reporting will be available here.'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Automatic Roster Sync</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automatically sync student and teacher rosters from {selectedPlatform === 'google_classroom' ? 'Google Classroom' : 'Clever'}
                  </p>
                </div>
                <Switch 
                  checked={syncEnabled} 
                  disabled={!canManage}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Grade Passback</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedPlatform === 'google_classroom' 
                      ? 'Automatically send quiz scores to Google Classroom gradebook'
                      : 'Track grades internally with downloadable reports'
                    }
                  </p>
                </div>
                <Switch 
                  checked={gradePassbackEnabled} 
                  disabled={!canManage}
                />
              </div>
              
              {canManage && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                  >
                    Disconnect {selectedPlatform === 'google_classroom' ? 'Google Classroom' : 'Clever'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 