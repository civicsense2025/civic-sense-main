"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Clock, 
  Eye, 
  Users, 
  AlertTriangle,
  Baby,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Globe,
  Bell,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Child {
  id: string
  name: string
  age: number
  grade: string
  avatar?: string
  isActive: boolean
}

interface ParentalControlSettings {
  // Time Management
  dailyTimeLimitMinutes: number
  allowedStartTime: string
  allowedEndTime: string
  allowedDays: number[]
  
  // Content Filtering
  contentFilterLevel: 'none' | 'light' | 'moderate' | 'strict'
  blockedCategories: string[]
  maxDifficultyLevel: number
  allowSensitiveTopics: boolean
  
  // Feature Access
  canAccessMultiplayer: boolean
  canAccessChat: boolean
  canShareProgress: boolean
  canViewLeaderboards: boolean
  requireParentApprovalForFriends: boolean
  
  // Monitoring
  sendProgressReports: boolean
  reportFrequency: 'daily' | 'weekly' | 'monthly'
  alertOnInappropriateContent: boolean
  trackDetailedActivity: boolean
}

const CATEGORIES = [
  'Government', 'Elections', 'Economy', 'Foreign Policy', 'Justice',
  'Civil Rights', 'Environment', 'Local Issues', 'Constitutional Law',
  'National Security', 'Public Policy', 'Historical Precedent'
]

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
]

export function ParentalControls() {
  const { toast } = useToast()
  
  // Mock data - would come from API
  const [children] = useState<Child[]>([
    { id: '1', name: 'Emma', age: 12, grade: '7th', isActive: true },
    { id: '2', name: 'Jake', age: 9, grade: '4th', isActive: true },
    { id: '3', name: 'Sophie', age: 15, grade: '10th', isActive: true }
  ])
  
  const [selectedChild, setSelectedChild] = useState<Child>(children[0])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Default settings based on age
  const getDefaultSettings = (age: number): ParentalControlSettings => {
    if (age <= 10) {
      return {
        dailyTimeLimitMinutes: 30,
        allowedStartTime: '15:00',
        allowedEndTime: '18:00',
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        contentFilterLevel: 'strict',
        blockedCategories: ['National Security', 'Justice'],
        maxDifficultyLevel: 2,
        allowSensitiveTopics: false,
        canAccessMultiplayer: false,
        canAccessChat: false,
        canShareProgress: true,
        canViewLeaderboards: false,
        requireParentApprovalForFriends: true,
        sendProgressReports: true,
        reportFrequency: 'daily',
        alertOnInappropriateContent: true,
        trackDetailedActivity: true
      }
    } else if (age <= 13) {
      return {
        dailyTimeLimitMinutes: 60,
        allowedStartTime: '15:00',
        allowedEndTime: '20:00',
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        contentFilterLevel: 'moderate',
        blockedCategories: ['National Security'],
        maxDifficultyLevel: 3,
        allowSensitiveTopics: false,
        canAccessMultiplayer: true,
        canAccessChat: false,
        canShareProgress: true,
        canViewLeaderboards: true,
        requireParentApprovalForFriends: true,
        sendProgressReports: true,
        reportFrequency: 'weekly',
        alertOnInappropriateContent: true,
        trackDetailedActivity: true
      }
    } else {
      return {
        dailyTimeLimitMinutes: 120,
        allowedStartTime: '14:00',
        allowedEndTime: '21:00',
        allowedDays: [1, 2, 3, 4, 5, 6, 7],
        contentFilterLevel: 'light',
        blockedCategories: [],
        maxDifficultyLevel: 5,
        allowSensitiveTopics: true,
        canAccessMultiplayer: true,
        canAccessChat: true,
        canShareProgress: true,
        canViewLeaderboards: true,
        requireParentApprovalForFriends: false,
        sendProgressReports: true,
        reportFrequency: 'weekly',
        alertOnInappropriateContent: false,
        trackDetailedActivity: false
      }
    }
  }
  
  const [settings, setSettings] = useState<ParentalControlSettings>(
    getDefaultSettings(selectedChild.age)
  )

  const updateSettings = (updates: Partial<ParentalControlSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  const saveSettings = async () => {
    try {
      // Here you would save to API
      toast({
        title: "Settings saved",
        description: `Parental controls updated for ${selectedChild.name}`,
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  }

  const resetToDefaults = () => {
    setSettings(getDefaultSettings(selectedChild.age))
    setHasUnsavedChanges(true)
    toast({
      title: "Settings reset",
      description: `Restored age-appropriate defaults for ${selectedChild.name}`,
    })
  }

  const getFilterLevelDescription = (level: string) => {
    switch (level) {
      case 'none': return 'All content available'
      case 'light': return 'Basic filtering of inappropriate content'
      case 'moderate': return 'Balanced protection with educational focus'
      case 'strict': return 'Maximum protection for young learners'
      default: return ''
    }
  }

  const getFilterLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'text-red-600'
      case 'light': return 'text-yellow-600'
      case 'moderate': return 'text-blue-600'
      case 'strict': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getAgeIcon = (age: number) => {
    if (age <= 10) return <Baby className="h-4 w-4" />
    if (age <= 13) return <BookOpen className="h-4 w-4" />
    return <GraduationCap className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parental Controls</h2>
          <p className="text-muted-foreground">
            Manage your children's learning experience with age-appropriate controls
          </p>
        </div>
        {hasUnsavedChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={saveSettings} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Child Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Child
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {children.map((child) => (
              <Card
                key={child.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  selectedChild.id === child.id && "ring-2 ring-primary"
                )}
                onClick={() => {
                  setSelectedChild(child)
                  setSettings(getDefaultSettings(child.age))
                  setHasUnsavedChanges(false)
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    {getAgeIcon(child.age)}
                  </div>
                  <h3 className="font-medium">{child.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Age {child.age} • {child.grade} Grade
                  </p>
                  <Badge 
                    variant={child.isActive ? "default" : "secondary"} 
                    className="mt-2"
                  >
                    {child.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controls for Selected Child */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Daily Time Limit</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.dailyTimeLimitMinutes]}
                  onValueChange={([value]) => updateSettings({ dailyTimeLimitMinutes: value })}
                  max={180}
                  min={15}
                  step={15}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  {settings.dailyTimeLimitMinutes} minutes per day
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={settings.allowedStartTime}
                  onChange={(e) => updateSettings({ allowedStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={settings.allowedEndTime}
                  onChange={(e) => updateSettings({ allowedEndTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Days</Label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant={settings.allowedDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      const newDays = settings.allowedDays.includes(day.value)
                        ? settings.allowedDays.filter(d => d !== day.value)
                        : [...settings.allowedDays, day.value]
                      updateSettings({ allowedDays: newDays })
                    }}
                  >
                    {day.label.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Filtering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Content Filtering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Filter Level</Label>
              <Select 
                value={settings.contentFilterLevel} 
                onValueChange={(value) => updateSettings({ contentFilterLevel: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">🔓 None</SelectItem>
                  <SelectItem value="light">🟡 Light</SelectItem>
                  <SelectItem value="moderate">🔵 Moderate</SelectItem>
                  <SelectItem value="strict">🟢 Strict</SelectItem>
                </SelectContent>
              </Select>
              <p className={cn("text-sm", getFilterLevelColor(settings.contentFilterLevel))}>
                {getFilterLevelDescription(settings.contentFilterLevel)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Difficulty Level</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.maxDifficultyLevel]}
                  onValueChange={([value]) => updateSettings({ maxDifficultyLevel: value })}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Level {settings.maxDifficultyLevel} of 5
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blocked Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={settings.blockedCategories.includes(category) ? "destructive" : "outline"}
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => {
                      const newBlocked = settings.blockedCategories.includes(category)
                        ? settings.blockedCategories.filter(c => c !== category)
                        : [...settings.blockedCategories, category]
                      updateSettings({ blockedCategories: newBlocked })
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              {settings.blockedCategories.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {settings.blockedCategories.length} categories blocked
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Feature Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multiplayer Quizzes</Label>
                <p className="text-sm text-muted-foreground">Play with friends and family</p>
              </div>
              <Switch
                checked={settings.canAccessMultiplayer}
                onCheckedChange={(checked) => updateSettings({ canAccessMultiplayer: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Chat Features</Label>
                <p className="text-sm text-muted-foreground">Send messages to pod members</p>
              </div>
              <Switch
                checked={settings.canAccessChat}
                onCheckedChange={(checked) => updateSettings({ canAccessChat: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Progress Sharing</Label>
                <p className="text-sm text-muted-foreground">Share achievements with family</p>
              </div>
              <Switch
                checked={settings.canShareProgress}
                onCheckedChange={(checked) => updateSettings({ canShareProgress: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Leaderboards</Label>
                <p className="text-sm text-muted-foreground">View ranking against others</p>
              </div>
              <Switch
                checked={settings.canViewLeaderboards}
                onCheckedChange={(checked) => updateSettings({ canViewLeaderboards: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Friend Approval Required</Label>
                <p className="text-sm text-muted-foreground">Parent must approve new friends</p>
              </div>
              <Switch
                checked={settings.requireParentApprovalForFriends}
                onCheckedChange={(checked) => updateSettings({ requireParentApprovalForFriends: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Monitoring & Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Progress Reports</Label>
                <p className="text-sm text-muted-foreground">Receive learning progress updates</p>
              </div>
              <Switch
                checked={settings.sendProgressReports}
                onCheckedChange={(checked) => updateSettings({ sendProgressReports: checked })}
              />
            </div>

            {settings.sendProgressReports && (
              <div className="space-y-2">
                <Label>Report Frequency</Label>
                <Select 
                  value={settings.reportFrequency} 
                  onValueChange={(value) => updateSettings({ reportFrequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Content Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert when inappropriate content is accessed</p>
              </div>
              <Switch
                checked={settings.alertOnInappropriateContent}
                onCheckedChange={(checked) => updateSettings({ alertOnInappropriateContent: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Detailed Activity Tracking</Label>
                <p className="text-sm text-muted-foreground">Track all quiz attempts and time spent</p>
              </div>
              <Switch
                checked={settings.trackDetailedActivity}
                onCheckedChange={(checked) => updateSettings({ trackDetailedActivity: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age-Appropriate Recommendations */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Age-Appropriate Recommendations for {selectedChild.name} (Age {selectedChild.age}):</strong>
          {selectedChild.age <= 10 && (
            <span> Strict content filtering, limited time, and supervised multiplayer activities are recommended for elementary-age children.</span>
          )}
          {selectedChild.age > 10 && selectedChild.age <= 13 && (
            <span> Moderate filtering with gradual independence. Monitor social features and maintain reasonable time limits.</span>
          )}
          {selectedChild.age > 13 && (
            <span> Light filtering with increased autonomy. Focus on digital citizenship and responsible online behavior.</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Save Changes Button (Mobile) */}
      {hasUnsavedChanges && (
        <div className="lg:hidden">
          <Button onClick={saveSettings} className="w-full gap-2">
            <Save className="h-4 w-4" />
            Save Changes for {selectedChild.name}
          </Button>
        </div>
      )}
    </div>
  )
} 