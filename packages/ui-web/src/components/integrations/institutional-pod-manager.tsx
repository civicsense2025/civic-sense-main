"use client"

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Building, 
  School, 
  BookOpen, 
  Users, 
  Plus, 
  ExternalLink,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  GraduationCap,
  Award,
  BarChart3,
  Zap,
  Crown,
  Star
} from 'lucide-react'
import { cn } from '../../utils'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from "../components/ui/use-toast"

interface InstitutionalPod {
  pod_id: string
  pod_name: string
  pod_type: string
  institutional_type: string
  level: string
  parent_name: string
  member_count: number
  user_role: string
}

interface PodHierarchy {
  pod_id: string
  pod_name: string
  pod_type: string
  institutional_type: string
  district_name: string
  school_name: string
  course_name: string
  member_count: number
  created_at: string
}

interface InstitutionalStats {
  totalPods: number
  totalMembers: number
  byLevel: {
    district: number
    school: number
    course: number
  }
  byRole: Record<string, number>
}

export function InstitutionalPodManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [pods, setPods] = useState<InstitutionalPod[]>([])
  const [hierarchy, setHierarchy] = useState<PodHierarchy[]>([])
  const [stats, setStats] = useState<InstitutionalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Create form state
  const [createForm, setCreateForm] = useState({
    type: '',
    name: '',
    districtId: '',
    schoolId: '',
    courseId: '',
    courseName: ''
  })

  const loadInstitutionalData = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      if (selectedLevel && selectedLevel !== 'all') {
        params.set('level', selectedLevel)
      }
      
      const response = await fetch(`/api/integrations/classroom/institutional-pods?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load institutional data')
      }
      
      const data = await response.json()
      
      setPods(data.data.userPods || [])
      setHierarchy(data.data.hierarchy || [])
      setStats(data.data.stats || null)
    } catch (error) {
      console.error('Error loading institutional data:', error)
      toast({
        title: "Error loading data",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutionalData()
  }, [user, selectedLevel])

  const createInstitutionalPod = async () => {
    if (!createForm.type || !createForm.name) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/integrations/classroom/institutional-pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Pod created successfully!",
          description: data.message,
        })
        setShowCreateForm(false)
        setCreateForm({
          type: '',
          name: '',
          districtId: '',
          schoolId: '',
          courseId: '',
          courseName: ''
        })
        loadInstitutionalData()
      } else {
        toast({
          title: "Error creating pod",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to create pod:', error)
      toast({
        title: "Error creating pod",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'District': return <Building className="h-4 w-4" />
      case 'School': return <School className="h-4 w-4" />
      case 'Course': return <BookOpen className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'District': return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
      case 'School': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'Course': return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-purple-500" />
      case 'teacher': return <GraduationCap className="h-4 w-4 text-blue-500" />
      case 'organizer': return <Settings className="h-4 w-4 text-orange-500" />
      default: return <Users className="h-4 w-4 text-slate-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading institutional pods...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <School className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">Sign in required</h3>
        <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-md mx-auto">
          Institutional pod management is only available to authenticated users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-light mb-4">
          <School className="h-4 w-4" />
          Institutional Integration
        </div>
        <h1 className="text-4xl font-light text-slate-900 dark:text-white tracking-tight">
          School-Pod Integration
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-3xl mx-auto">
          Manage civic learning pods across districts, schools, and classrooms with seamless Google Classroom integration
        </p>
        
        <div className="flex justify-center gap-4">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-48 border-0 bg-slate-100 dark:bg-slate-800 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="district">District Programs</SelectItem>
              <SelectItem value="school">School Programs</SelectItem>
              <SelectItem value="course">Course Pods</SelectItem>
            </SelectContent>
          </Select>
          
          {!showCreateForm && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-full px-6 h-10 font-light"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Pod
            </Button>
          )}
        </div>
      </div>

      {/* Create Pod Form */}
      {showCreateForm && (
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-sm bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-light text-slate-900 dark:text-white">
                Create Institutional Pod
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-light">Pod Type</Label>
                  <Select 
                    value={createForm.type} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="border-0 bg-white dark:bg-slate-800 h-12">
                      <SelectValue placeholder="Select pod type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="district_program">🏛️ District Program</SelectItem>
                      <SelectItem value="school_program">🏫 School Program</SelectItem>
                      <SelectItem value="course_pod">📚 Course Pod</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-light">Program/Pod Name</Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Constitution Challenge 2024"
                    className="border-0 bg-white dark:bg-slate-800 h-12 text-lg font-light"
                  />
                </div>

                {createForm.type === 'district_program' && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-light">District ID</Label>
                    <Input
                      value={createForm.districtId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, districtId: e.target.value }))}
                      placeholder="District identifier"
                      className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                    />
                  </div>
                )}

                {(createForm.type === 'school_program' || createForm.type === 'course_pod') && (
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-light">School ID</Label>
                    <Input
                      value={createForm.schoolId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, schoolId: e.target.value }))}
                      placeholder="School identifier"
                      className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                    />
                  </div>
                )}

                {createForm.type === 'course_pod' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-light">Course ID</Label>
                      <Input
                        value={createForm.courseId}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, courseId: e.target.value }))}
                        placeholder="Google Classroom course ID"
                        className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-light">Course Name</Label>
                      <Input
                        value={createForm.courseName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, courseName: e.target.value }))}
                        placeholder="e.g., AP Government"
                        className="border-0 bg-white dark:bg-slate-800 h-12 font-light"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={createInstitutionalPod}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white h-12 font-light"
                >
                  Create Pod
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-12 font-light border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">
              {stats.totalPods}
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Total Pods</p>
            <div className="text-sm text-slate-500">
              across all institutions
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">
              {stats.totalMembers}
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Total Members</p>
            <div className="text-sm text-slate-500">
              active participants
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">
              {stats.byLevel.district + stats.byLevel.school + stats.byLevel.course}
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Active Programs</p>
            <div className="text-sm text-slate-500">
              {stats.byLevel.district}D • {stats.byLevel.school}S • {stats.byLevel.course}C
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl font-light text-slate-900 dark:text-white">
              {Object.keys(stats.byRole).length}
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-light">Role Types</p>
            <div className="text-sm text-slate-500">
              diverse leadership
            </div>
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-12 bg-slate-100 dark:bg-slate-800 h-12">
          <TabsTrigger value="overview" className="font-light">My Pods</TabsTrigger>
          <TabsTrigger value="hierarchy" className="font-light">Institution View</TabsTrigger>
          <TabsTrigger value="management" className="font-light">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {pods.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <School className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-light text-slate-900 dark:text-white mb-2">No institutional pods yet</h3>
              <p className="text-slate-500 dark:text-slate-400 font-light mb-8 max-w-md mx-auto">
                Create or join institutional pods to integrate civic learning with your educational organization
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-full px-8 py-3 h-12 font-light"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Pod
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by level */}
              {['District', 'School', 'Course'].map(level => {
                const levelPods = pods.filter(pod => pod.level === level)
                if (levelPods.length === 0) return null

                return (
                  <div key={level} className="space-y-4">
                    <div className="flex items-center gap-3">
                      {getLevelIcon(level)}
                      <h3 className="text-xl font-light text-slate-900 dark:text-white">
                        {level} Level ({levelPods.length})
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {levelPods.map((pod) => (
                        <Card 
                          key={pod.pod_id}
                          className="border-0 bg-slate-50 dark:bg-slate-900/50 hover:shadow-lg transition-all duration-200"
                        >
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <Badge className={cn(getLevelColor(pod.level), "border-0")}>
                                  {pod.level}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {getRoleIcon(pod.user_role)}
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {pod.user_role}
                                  </span>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-white text-lg mb-1">
                                  {pod.pod_name}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {pod.parent_name}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4 text-slate-400" />
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {pod.member_count} members
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-200 dark:border-slate-700"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View Pod
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-8">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Institutional Hierarchy
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Complete view of how civic learning pods integrate across your educational institutions
            </p>
          </div>

          {hierarchy.length === 0 ? (
            <div className="text-center py-16">
              <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-light text-slate-900 dark:text-white mb-2">No hierarchy data</h3>
              <p className="text-slate-500 dark:text-slate-400 font-light">
                Institutional hierarchy will appear as pods are created and linked to schools
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by district, then school */}
              {Array.from(new Set(hierarchy.map(h => h.district_name))).map(districtName => (
                <Card key={districtName} className="border-0 bg-slate-50 dark:bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-purple-500" />
                      {districtName || 'Independent Institution'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.from(new Set(
                      hierarchy
                        .filter(h => h.district_name === districtName)
                        .map(h => h.school_name)
                    )).map(schoolName => (
                      <div key={schoolName} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <School className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {schoolName || 'District-wide Programs'}
                          </h4>
                        </div>
                        
                        <div className="ml-6 space-y-2">
                          {hierarchy
                            .filter(h => h.district_name === districtName && h.school_name === schoolName)
                            .map(pod => (
                              <div 
                                key={pod.pod_id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                              >
                                <div className="flex items-center gap-3">
                                  <BookOpen className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                      {pod.pod_name}
                                    </p>
                                    {pod.course_name && (
                                      <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Course: {pod.course_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{pod.member_count}</span>
                                  </div>
                                  <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                                    {pod.institutional_type}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-8">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-2xl font-light text-slate-900 dark:text-white">
              Integration Management
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
              Manage Google Classroom integration, sync rosters, and monitor pod health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Google Classroom Integration */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Google Classroom
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Integration Status</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Connected and syncing</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync All Rosters
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Pending Grades
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Integration Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pod Health Monitoring */}
            <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pod Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sync Success Rate</span>
                    <span className="text-sm font-medium text-green-600">98.5%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Engagement</span>
                    <span className="text-sm font-medium text-blue-600">87.2%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.2%' }}></div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">Create District Program</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <School className="h-5 w-5" />
                  <span className="text-sm">Import Classroom</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Award className="h-5 w-5" />
                  <span className="text-sm">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 