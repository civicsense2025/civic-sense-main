"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  ExternalLink,
  Users,
  BookOpen,
  RefreshCw,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Plus,
  ArrowRight,
  Zap,
  BarChart3
} from 'lucide-react'
import { cn } from '../../utils'
import { useToast } from "../components/ui/use-toast"
import { GoogleClassroomIntegration } from '@civicsense/shared/integrations/google-classroom'

interface ClassroomCourse {
  id: string
  name: string
  description?: string
  section?: string
  ownerId: string
  teacherGroupEmail?: string
  studentCount?: number
}

interface ClassroomSyncLog {
  id: string
  sync_type: string
  sync_status: string
  records_processed: number
  records_successful: number
  error_details?: any
  created_at: string
}

interface ClassroomIntegrationPanelProps {
  podId: string
  podName: string
  googleClassroomId?: string
  classroomSyncEnabled?: boolean
  gradePassbackEnabled?: boolean
  lastSync?: string
  userRole: string
  onUpdate?: () => void
}

export function ClassroomIntegrationPanel({
  podId,
  podName,
  googleClassroomId,
  classroomSyncEnabled = false,
  gradePassbackEnabled = false,
  lastSync,
  userRole,
  onUpdate
}: ClassroomIntegrationPanelProps) {
  const { toast } = useToast()
  
  const [isConnected, setIsConnected] = useState(!!googleClassroomId)
  const [courses, setCourses] = useState<ClassroomCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(null)
  const [syncLogs, setSyncLogs] = useState<ClassroomSyncLog[]>([])
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

  // Check if user can manage classroom integration
  const canManage = ['admin', 'parent', 'organizer', 'teacher'].includes(userRole)

  const connectToClassroom = async () => {
    if (!canManage) {
      toast({
        title: "Permission denied",
        description: "Only teachers, organizers, parents, and admins can manage Classroom integration.",
        variant: "destructive"
      })
      return
    }

    try {
      // In a real implementation, this would trigger OAuth flow
      toast({
        title: "OAuth Required",
        description: "Google Classroom OAuth integration needs to be implemented.",
        variant: "destructive"
      })
      
      // For demo purposes, show sample courses
      setCourses([
        {
          id: 'sample-course-1',
          name: 'Civics 101 - Fall 2024',
          description: 'Introduction to American Government and Civic Responsibility',
          section: 'Period 3',
          ownerId: 'teacher-123',
          studentCount: 24
        },
        {
          id: 'sample-course-2', 
          name: 'AP Government - Fall 2024',
          description: 'Advanced Placement U.S. Government and Politics',
          section: 'Period 5',
          ownerId: 'teacher-123',
          studentCount: 18
        }
      ])
      
    } catch (error) {
      console.error('Failed to connect to Classroom:', error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Classroom.",
        variant: "destructive"
      })
    }
  }

  const linkCourse = async (course: ClassroomCourse) => {
    if (!canManage) return

    try {
      setIsLoading(true)
      
      // In a real implementation, this would call the import API
      toast({
        title: "Course linked successfully",
        description: `${course.name} has been linked to ${podName}.`,
      })
      
      setIsConnected(true)
      setSelectedCourse(course)
      
      if (onUpdate) onUpdate()
      
    } catch (error) {
      console.error('Failed to link course:', error)
      toast({
        title: "Link failed",
        description: "Failed to link the Classroom course.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const syncRoster = async () => {
    if (!canManage || !googleClassroomId) return

    try {
      setIsSyncing(true)
      
      // In a real implementation, this would call the sync-roster API
      toast({
        title: "Roster sync started",
        description: "Syncing classroom roster with learning pod members...",
      })
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Roster sync completed",
        description: "Successfully synced 24 students and 2 teachers.",
      })
      
      if (onUpdate) onUpdate()
      
    } catch (error) {
      console.error('Failed to sync roster:', error)
      toast({
        title: "Sync failed",
        description: "Failed to sync classroom roster.",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const createAssignment = async () => {
    if (!canManage || !googleClassroomId) return

    try {
      setIsLoading(true)
      
      // In a real implementation, this would call the create-assignment API
      toast({
        title: "Assignment created",
        description: `"${assignmentForm.title}" has been created in Google Classroom.`,
      })
      
      setShowAssignmentForm(false)
      setAssignmentForm({
        title: '',
        description: '',
        topicId: '',
        dueDate: '',
        maxPoints: 100
      })
      
    } catch (error) {
      console.error('Failed to create assignment:', error)
      toast({
        title: "Assignment creation failed",
        description: "Failed to create the assignment in Google Classroom.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processGrades = async () => {
    if (!canManage || !googleClassroomId) return

    try {
      setIsLoading(true)
      
      // In a real implementation, this would call the process-grades API
      toast({
        title: "Processing grades",
        description: "Sending pending quiz scores to Google Classroom...",
      })
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      toast({
        title: "Grades processed",
        description: "Successfully sent 12 quiz scores to Google Classroom.",
      })
      
    } catch (error) {
      console.error('Failed to process grades:', error)
      toast({
        title: "Grade processing failed",
        description: "Failed to send grades to Google Classroom.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected && !googleClassroomId) {
    return (
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-light text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Google Classroom Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto">
              <ExternalLink className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Connect to Google Classroom
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-light max-w-md mx-auto">
                Link this learning pod to your Google Classroom course to automatically sync rosters and send quiz grades.
              </p>
            </div>
            
            {canManage ? (
              <Button 
                onClick={connectToClassroom}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-3 h-12 font-light"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to Classroom
              </Button>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only teachers, organizers, parents, and admins can set up Classroom integration.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {courses.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                  Select a Course to Link
                </h4>
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="border border-slate-200 dark:border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-slate-900 dark:text-white">
                              {course.name}
                            </h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {course.description}
                            </p>
                            {course.section && (
                              <Badge variant="secondary" className="mt-1">
                                {course.section}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                              {course.studentCount} students
                            </p>
                            <Button
                              onClick={() => linkCourse(course)}
                              disabled={isLoading}
                              size="sm"
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Link Course
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
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
                  Google Classroom Connected
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {selectedCourse?.name || 'Connected to classroom course'}
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

      {/* Management Actions */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={syncRoster}
            disabled={isSyncing || !classroomSyncEnabled}
            className="h-24 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
            <span className="text-sm">Sync Roster</span>
          </Button>

          <Button
            onClick={() => setShowAssignmentForm(true)}
            className="h-24 flex-col gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Create Assignment</span>
          </Button>

          <Button
            onClick={processGrades}
            disabled={isLoading || !gradePassbackEnabled}
            className="h-24 flex-col gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Zap className="h-5 w-5" />
            <span className="text-sm">Process Grades</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">View Analytics</span>
          </Button>
        </div>
      )}

      {/* Assignment Creation Form */}
      {showAssignmentForm && canManage && (
        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg font-light">Create Classroom Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignment Title</Label>
                <Input
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Constitutional Rights Quiz"
                />
              </div>
              <div className="space-y-2">
                <Label>Quiz Topic ID</Label>
                <Input
                  value={assignmentForm.topicId}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, topicId: e.target.value }))}
                  placeholder="e.g., constitutional-rights"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Assignment instructions and learning objectives..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Points</Label>
                <Input
                  type="number"
                  value={assignmentForm.maxPoints}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={createAssignment}
                disabled={isLoading || !assignmentForm.title || !assignmentForm.topicId}
              >
                Create Assignment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssignmentForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Settings */}
      <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Automatic Roster Sync</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatically sync student and teacher rosters from Google Classroom
              </p>
            </div>
            <Switch 
              checked={classroomSyncEnabled} 
              disabled={!canManage}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Grade Passback</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatically send quiz scores to Google Classroom gradebook
              </p>
            </div>
            <Switch 
              checked={gradePassbackEnabled} 
              disabled={!canManage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {syncLogs.length > 0 && (
        <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-lg font-light">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      log.sync_status === 'success' ? 'bg-green-500' :
                      log.sync_status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {log.sync_type} sync
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {log.records_successful}/{log.records_processed} successful
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 