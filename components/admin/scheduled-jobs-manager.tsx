'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Clock, Play, Pause, Edit, Trash2, BarChart3, Eye, Calendar, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'

interface ScheduledJob {
  id: string
  name: string
  description?: string
  job_type: string
  is_active: boolean
  schedule_config: any
  generation_settings: any
  next_run_at: string
  last_run_at?: string
  last_run_status?: string
  total_runs: number
  successful_runs: number
  consecutive_failures: number
  max_failures: number
  total_content_generated: number
  created_at: string
}

interface JobStatistics {
  totalJobs: number
  activeJobs: number
  totalRuns: number
  successfulRuns: number
  totalContentGenerated: number
  jobsReadyToRun: number
}

interface PreviewData {
  statistics: any
  sampleTopics: any[]
  sampleArticles: any[]
  recommendations: string[]
  qualityIndicators: any
}

export function ScheduledJobsManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [statistics, setStatistics] = useState<JobStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Form state for creating/editing jobs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    jobType: 'content_generation',
    schedule: {
      interval: 'daily',
      timeOfDay: '06:00',
      timezone: 'America/New_York'
    },
    settings: {
      maxArticles: 10,
      daysSinceCreated: 7,
      questionsPerTopic: 6,
      questionTypeDistribution: {
        multipleChoice: 60,
        trueFalse: 25,
        shortAnswer: 15,
        fillInBlank: 0,
        matching: 0
      },
      difficultyDistribution: {
        easy: 30,
        medium: 50,
        hard: 20
      },
      daysAhead: 1,
      categories: [],
      aiModel: 'gpt-4-turbo',
      temperature: 0.7,
      autoApprove: false
    }
  })

  const loadJobs = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/admin/schedule-content-generation?userId=${user.id}&includeLogs=true`)
      const result = await response.json()

      if (result.success) {
        setJobs(result.jobs)
        setStatistics(result.statistics)
      } else {
        toast({
          title: "Error loading jobs",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      toast({
        title: "Error loading jobs",
        description: "Failed to fetch scheduled jobs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleCreateJob = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/admin/schedule-content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          jobData: {
            name: formData.name,
            description: formData.description,
            jobType: formData.jobType,
            scheduleConfig: formData.schedule,
            generationSettings: formData.settings
          },
          userId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Job created successfully",
          description: `${formData.name} has been scheduled`
        })
        setShowCreateDialog(false)
        resetForm()
        loadJobs()
      } else {
        toast({
          title: "Error creating job",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating job:', error)
      toast({
        title: "Error creating job",
        description: "Failed to create scheduled job",
        variant: "destructive"
      })
    }
  }

  const handleJobAction = async (jobId: string, action: string) => {
    if (!user) return

    try {
      const response = await fetch('/api/admin/schedule-content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          jobId,
          userId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Action completed",
          description: result.message
        })
        loadJobs()
      } else {
        toast({
          title: "Action failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error performing job action:', error)
      toast({
        title: "Action failed",
        description: "Failed to perform action",
        variant: "destructive"
      })
    }
  }

  const generatePreview = async () => {
    if (!user) return

    setPreviewLoading(true)
    try {
      const response = await fetch('/api/admin/content-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData.settings,
          userId: user.id,
          includeAIGenerated: false // Use templates for faster preview
        })
      })

      const result = await response.json()

      if (result.success) {
        setPreviewData(result.preview)
        toast({
          title: "Preview generated",
          description: "Sample content preview is ready"
        })
      } else {
        toast({
          title: "Preview failed",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      toast({
        title: "Preview failed",
        description: "Failed to generate preview",
        variant: "destructive"
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      jobType: 'content_generation',
      schedule: {
        interval: 'daily',
        timeOfDay: '06:00',
        timezone: 'America/New_York'
      },
      settings: {
        maxArticles: 10,
        daysSinceCreated: 7,
        questionsPerTopic: 6,
        questionTypeDistribution: {
          multipleChoice: 60,
          trueFalse: 25,
          shortAnswer: 15,
          fillInBlank: 0,
          matching: 0
        },
        difficultyDistribution: {
          easy: 30,
          medium: 50,
          hard: 20
        },
        daysAhead: 1,
        categories: [],
        aiModel: 'gpt-4-turbo',
        temperature: 0.7,
        autoApprove: false
      }
    })
    setPreviewData(null)
  }

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const timeDiff = date.getTime() - now.getTime()
    
    if (timeDiff < 0) return 'Overdue'
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours < 24) {
      return `${hours}h ${minutes}m`
    } else {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading scheduled jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold">{statistics.totalJobs}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.activeJobs}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {statistics.totalRuns > 0 
                      ? Math.round((statistics.successfulRuns / statistics.totalRuns) * 100)
                      : 0}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Content Generated</p>
                  <p className="text-2xl font-bold">{statistics.totalContentGenerated}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Content Generation</h2>
          <p className="text-gray-600">Automate your civic education content creation</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Calendar className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Scheduled Content Generation</DialogTitle>
              <DialogDescription>
                Set up automated content generation with custom scheduling and quality settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="settings">Content Settings</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="job-name">Job Name</Label>
                    <Input
                      id="job-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Daily Morning Content Generation"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="job-description">Description</Label>
                    <Textarea
                      id="job-description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Generate daily civic education content from recent news articles"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="job-type">Job Type</Label>
                    <Select
                      value={formData.jobType}
                      onValueChange={(value) => setFormData({...formData, jobType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content_generation">Content Generation</SelectItem>
                        <SelectItem value="quiz_generation">Quiz Generation</SelectItem>
                        <SelectItem value="survey_optimization">Survey Optimization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule-interval">Interval</Label>
                    <Select
                      value={formData.schedule.interval}
                      onValueChange={(value) => setFormData({
                        ...formData, 
                        schedule: {...formData.schedule, interval: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every12hours">Every 12 Hours</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="schedule-time">Time of Day</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={formData.schedule.timeOfDay}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: {...formData.schedule, timeOfDay: e.target.value}
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="schedule-timezone">Timezone</Label>
                    <Select
                      value={formData.schedule.timezone}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        schedule: {...formData.schedule, timezone: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-articles">Max Articles</Label>
                    <Input
                      id="max-articles"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.settings.maxArticles}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, maxArticles: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="days-since-created">Days Since Created</Label>
                    <Input
                      id="days-since-created"
                      type="number"
                      min="0"
                      max="30"
                      value={formData.settings.daysSinceCreated}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, daysSinceCreated: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="questions-per-topic">Questions Per Topic</Label>
                    <Input
                      id="questions-per-topic"
                      type="number"
                      min="3"
                      max="50"
                      value={formData.settings.questionsPerTopic}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, questionsPerTopic: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="days-ahead">Days Ahead</Label>
                    <Input
                      id="days-ahead"
                      type="number"
                      min="0"
                      max="7"
                      value={formData.settings.daysAhead}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {...formData.settings, daysAhead: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-approve"
                    checked={formData.settings.autoApprove}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      settings: {...formData.settings, autoApprove: checked}
                    })}
                  />
                  <Label htmlFor="auto-approve">Auto-approve generated content</Label>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Content Preview</h3>
                  <Button 
                    onClick={generatePreview} 
                    disabled={previewLoading}
                    variant="outline"
                  >
                    {previewLoading ? 'Generating...' : 'Generate Preview'}
                  </Button>
                </div>

                {previewData && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Expected Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Topics to Generate: {previewData.statistics.topicsToGenerate}</div>
                          <div>Questions to Generate: {previewData.statistics.questionsToGenerate}</div>
                          <div>Processing Time: ~{previewData.statistics.estimatedProcessingTime}s</div>
                          <div>Quality Score: {previewData.statistics.contentQualityScore}/100</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sample Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {previewData.sampleTopics.slice(0, 2).map((topic, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <h4 className="font-medium">{topic.title}</h4>
                              <p className="text-sm text-gray-600">{topic.description}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {topic.uncomfortableTruths?.slice(0, 1).map((truth: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    🔥 {truth}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {previewData.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {previewData.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateJob}
                disabled={!formData.name}
              >
                Create Scheduled Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Jobs</h3>
              <p className="text-gray-600 mb-4">
                Create your first scheduled content generation job to automate your civic education content.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create Your First Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {job.name}
                      {job.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {job.last_run_status && (
                        <Badge className={getStatusColor(job.last_run_status)}>
                          {job.last_run_status}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{job.description}</CardDescription>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'run_now')}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'toggle_active')}
                    >
                      {job.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJobAction(job.id, 'delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Next Run</p>
                    <p className="font-medium">
                      {job.is_active ? formatNextRun(job.next_run_at) : 'Inactive'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Interval</p>
                    <p className="font-medium capitalize">
                      {job.schedule_config?.interval || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Success Rate</p>
                    <p className="font-medium">
                      {job.total_runs > 0 
                        ? Math.round((job.successful_runs / job.total_runs) * 100)
                        : 0}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">Content Generated</p>
                    <p className="font-medium">{job.total_content_generated}</p>
                  </div>
                </div>
                
                {job.consecutive_failures > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm text-red-700">
                        {job.consecutive_failures} consecutive failures 
                        ({job.max_failures - job.consecutive_failures} attempts remaining)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 