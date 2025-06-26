/**
 * Question Topic Creation Page
 * 
 * Allows administrators to create new civic education topics with comprehensive
 * content structure and metadata management.
 */

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useAdmin } from "@/lib/admin-access"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Plus, 
  X, 
  Calendar,
  Tag,
  Sparkles,
  Eye,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface NewTopicData {
  topic_id: string
  topic_title: string
  description: string
  why_this_matters: string
  emoji: string
  date: string
  day_of_week: string
  categories: string[]
  is_active: boolean
  is_breaking: boolean
  is_featured: boolean
}

// Approved categories from CivicSense content guidelines
const APPROVED_CATEGORIES = [
  'Civic Participation', 'Environment', 'Immigration', 'Civic Action',
  'Judicial Review', 'National Security', 'Public Policy', 'Constitutional Law',
  'Foreign Policy', 'Government', 'AI Governance', 'Economy', 'Civil Rights',
  'Media Literacy', 'Elections', 'Historical Precedent', 'Policy Analysis',
  'Electoral Systems', 'Local Issues', 'Justice', 'Legislative Process'
]

const DAY_OPTIONS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
  'Thursday', 'Friday', 'Saturday'
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateTopicPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<NewTopicData>({
    topic_id: '',
    topic_title: '',
    description: '',
    why_this_matters: '',
    emoji: '📰',
    date: new Date().toISOString().split('T')[0],
    day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    categories: [],
    is_active: true,
    is_breaking: false,
    is_featured: false
  })

  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newCategory, setNewCategory] = useState('')

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  /**
   * Generate topic ID from title
   */
  const generateTopicId = (title: string): string => {
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40)
    
    const year = new Date().getFullYear()
    return `${baseId}_${year}`
  }

  /**
   * Update form field
   */
  const updateField = (field: keyof NewTopicData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-generate topic_id when title changes
      if (field === 'topic_title' && value) {
        updated.topic_id = generateTopicId(value)
      }
      
      return updated
    })
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  /**
   * Add category to the list
   */
  const addCategory = (category: string) => {
    if (category && !formData.categories.includes(category)) {
      updateField('categories', [...formData.categories, category])
    }
    setNewCategory('')
  }

  /**
   * Remove category from the list
   */
  const removeCategory = (category: string) => {
    updateField('categories', formData.categories.filter(c => c !== category))
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.topic_title.trim()) {
      newErrors.topic_title = 'Title is required'
    } else if (formData.topic_title.length > 200) {
      newErrors.topic_title = 'Title must be 200 characters or less'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    if (!formData.why_this_matters.trim()) {
      newErrors.why_this_matters = 'Why This Matters is required for civic education'
    }

    if (!formData.topic_id.trim()) {
      newErrors.topic_id = 'Topic ID is required'
    } else if (!/^[a-z0-9_]+$/.test(formData.topic_id)) {
      newErrors.topic_id = 'Topic ID can only contain lowercase letters, numbers, and underscores'
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required'
    }

    if (!formData.emoji.trim()) {
      newErrors.emoji = 'Emoji is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)
      
      const supabase = createClient()
      
      // Check if topic_id already exists
      const { data: existingTopic, error: checkError } = await supabase
        .from('question_topics')
        .select('topic_id')
        .eq('topic_id', formData.topic_id)
        .maybeSingle()

      if (checkError) {
        throw new Error(`Failed to check for existing topic: ${checkError.message}`)
      }

      if (existingTopic) {
        setErrors({ topic_id: 'A topic with this ID already exists' })
        toast({
          title: "Duplicate Topic ID",
          description: "Please choose a different topic ID",
          variant: "destructive"
        })
        return
      }

      // Create the new topic
      const { data: newTopic, error: createError } = await supabase
        .from('question_topics')
        .insert({
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create topic: ${createError.message}`)
      }

      toast({
        title: "Topic Created",
        description: `Successfully created "${formData.topic_title}"`,
      })

      // Redirect to the new topic's detail page
      router.push(`/admin/question-topics/${formData.topic_id}`)

    } catch (error) {
      console.error('Error creating topic:', error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create topic",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  // ============================================================================
  // LOADING AND ACCESS CONTROL
  // ============================================================================

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You don't have permission to create topics.</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <main className="w-full py-8">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/admin/question-topics">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Topics
                </Link>
              </Button>
              <div className="border-l border-slate-200 dark:border-slate-700 h-6" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-light text-slate-900 dark:text-white">
                    Create New Topic
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Build a new civic education topic for the community
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Topic Title *
                  </label>
                  <Input
                    value={formData.topic_title}
                    onChange={(e) => updateField('topic_title', e.target.value)}
                    placeholder="How the Senate Actually Works: The Filibuster Edition"
                    className={cn(errors.topic_title && "border-red-500")}
                  />
                  {errors.topic_title && (
                    <p className="text-sm text-red-600">{errors.topic_title}</p>
                  )}
                </div>

                {/* Topic ID */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Topic ID *
                  </label>
                  <Input
                    value={formData.topic_id}
                    onChange={(e) => updateField('topic_id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="senate_filibuster_2024"
                    className={cn(errors.topic_id && "border-red-500")}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auto-generated from title. Use lowercase letters, numbers, and underscores only.
                  </p>
                  {errors.topic_id && (
                    <p className="text-sm text-red-600">{errors.topic_id}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Description *
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="A brief explanation of what this topic covers and why it matters for civic understanding..."
                    rows={3}
                    className={cn(errors.description && "border-red-500")}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formData.description.length}/1000 characters
                  </p>
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Why This Matters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Why This Matters *
                  </label>
                  <Textarea
                    value={formData.why_this_matters}
                    onChange={(e) => updateField('why_this_matters', e.target.value)}
                    placeholder="<ul><li><strong>Your Vote:</strong> Understanding how the filibuster actually works helps you...</li><li><strong>Your Voice:</strong> This knowledge allows you to...</li></ul>"
                    rows={4}
                    className={cn(errors.why_this_matters && "border-red-500")}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use HTML formatting to create compelling bullet points that connect to personal impact
                  </p>
                  {errors.why_this_matters && (
                    <p className="text-sm text-red-600">{errors.why_this_matters}</p>
                  )}
                </div>

                {/* Emoji */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Emoji *
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={formData.emoji}
                      onChange={(e) => updateField('emoji', e.target.value)}
                      placeholder="📰"
                      className={cn("w-20 text-center text-lg", errors.emoji && "border-red-500")}
                    />
                    <span className="text-2xl">{formData.emoji}</span>
                  </div>
                  {errors.emoji && (
                    <p className="text-sm text-red-600">{errors.emoji}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Add Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-white">
                    Add Categories *
                  </label>
                  <div className="flex gap-2">
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPROVED_CATEGORIES
                          .filter(cat => !formData.categories.includes(cat))
                          .map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => addCategory(newCategory)}
                      disabled={!newCategory || formData.categories.includes(newCategory)}
                    >
                      Add
                    </Button>
                  </div>
                  {errors.categories && (
                    <p className="text-sm text-red-600">{errors.categories}</p>
                  )}
                </div>

                {/* Selected Categories */}
                {formData.categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      Selected Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map(category => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <button
                            type="button"
                            onClick={() => removeCategory(category)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduling & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduling & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                  </div>

                  {/* Day of Week */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      Day of Week
                    </label>
                    <Select value={formData.day_of_week} onValueChange={(value) => updateField('day_of_week', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_OPTIONS.map(day => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Active</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Topic is available for quizzes and learning
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => updateField('is_active', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Featured</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Show prominently on the main page
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => updateField('is_featured', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Breaking News</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mark as urgent or time-sensitive content
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_breaking}
                      onCheckedChange={(checked) => updateField('is_breaking', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{formData.emoji}</span>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {formData.topic_title || 'Topic Title'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formData.topic_id || 'topic_id'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400">
                    {formData.description || 'Topic description will appear here...'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map(category => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Badge variant={formData.is_active ? "default" : "secondary"}>
                      {formData.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {formData.is_featured && (
                      <Badge className="bg-purple-100 text-purple-700">Featured</Badge>
                    )}
                    {formData.is_breaking && (
                      <Badge className="bg-red-100 text-red-700">Breaking News</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/question-topics">
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Topic
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 