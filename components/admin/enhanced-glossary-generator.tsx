"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Wand2, Globe, BookOpen, Target, Zap, Search, AlertCircle, CheckCircle, XCircle, SkipForward } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Language {
  code: string
  name: string
  native: string
}

interface Category {
  id: string
  name: string
  emoji: string
  description?: string
  display_order?: number
}

interface GenerationOptions {
  count: number
  categories?: string[]
  difficulty_level?: number
  include_web_search?: boolean
}

interface GenerationRequest {
  type: 'extract_from_content' | 'generate_new' | 'optimize_existing'
  provider: 'openai' | 'anthropic'
  custom_content?: string
  options: GenerationOptions
}

interface ProgressUpdate {
  type: 'processing' | 'saved' | 'skipped' | 'failed' | 'complete'
  termIndex?: number
  totalTerms?: number
  termName?: string
  error?: string
  stats?: any
  timestamp: string
}

export function EnhancedGlossaryGenerator() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  
  // Form state
  const [generationType, setGenerationType] = useState<'generate_new' | 'extract_from_content' | 'optimize_existing'>('generate_new')
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('anthropic')
  const [customContent, setCustomContent] = useState('')
  const [count, setCount] = useState(5)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3)
  const [enableWebSearch, setEnableWebSearch] = useState(true)
  
  // Results and Progress
  const [results, setResults] = useState<any>(null)
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [currentProgress, setCurrentProgress] = useState<{
    current: number
    total: number
    status: string
  }>({ current: 0, total: 0, status: '' })

  // Load available categories on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        console.log('🔍 Loading categories...')
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        console.log('🔍 Categories response:', {
          status: categoriesResponse.status,
          success: categoriesData.success,
          categoriesCount: categoriesData.categories?.length,
          firstCategory: categoriesData.categories?.[0],
          debug: categoriesData.debug
        })
        
        if (categoriesData.success && categoriesData.categories) {
          // Validate and filter categories to ensure proper data structure
          const validCategories = categoriesData.categories
            .filter((cat: any) => {
              const isValid = cat && 
                (cat.id || cat.category_id) && 
                (cat.name || cat.category_title) && 
                (cat.emoji || cat.icon)
              
              if (!isValid) {
                console.warn('⚠️ Invalid category found:', cat)
              }
              return isValid
            })
            .map((cat: any) => ({
              // Handle multiple possible field names from the API
              id: cat.id || cat.category_id || `category_${Date.now()}_${Math.random()}`,
              name: cat.name || cat.category_title || cat.title || 'Unnamed Category',
              emoji: cat.emoji || cat.icon || '📁',
              description: cat.description || cat.category_description || '',
              display_order: cat.display_order || cat.order || 0
            }))
          
          console.log('✅ Processed categories:', {
            original: categoriesData.categories.length,
            valid: validCategories.length,
            sample: validCategories.slice(0, 3).map((c: Category) => ({ id: c.id, name: c.name, emoji: c.emoji }))
          })
          
          setAvailableCategories(validCategories)
        } else {
          console.warn('⚠️ Categories response failed or empty:', categoriesData)
          setAvailableCategories([])
        }
      } catch (error) {
        console.error('❌ Error loading categories:', error)
        setAvailableCategories([])
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        })
      }
    }

    loadData()
  }, [toast])

  const handleGenerate = async () => {
    try {
      setIsLoading(true)
      setResults(null)
      setProgressUpdates([])
      setCurrentProgress({ current: 0, total: count, status: 'Starting...' })

      // Filter out any null/undefined categories and ensure proper data types
      const validCategories = selectedCategories.filter(cat => cat && cat.trim().length > 0)
      
      console.log('🎯 Generation request data:', {
        type: generationType,
        provider,
        count,
        selectedCategories: selectedCategories.length,
        validCategories: validCategories.length,
        validCategoriesList: validCategories,
        customContent: customContent?.trim()
      })

      // Ensure the request matches the API schema exactly
      const request: GenerationRequest = {
        type: generationType,
        provider,
        custom_content: customContent?.trim() || undefined,
        options: {
          count,
          categories: validCategories.length > 0 ? validCategories : undefined,
          difficulty_level: difficultyLevel,
          include_web_search: enableWebSearch,
        }
      }

      // Remove undefined values to clean up the request
      if (!request.custom_content) {
        delete request.custom_content
      }
      if (!request.options.categories || request.options.categories.length === 0) {
        delete request.options.categories
      }

      console.log('🚀 Final request to API:', JSON.stringify(request, null, 2))

      const response = await fetch('/api/admin/glossary/ai-generate?stream=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      // Enhanced error handling
      if (!response.ok) {
        let errorMessage = 'Generation failed'
        let errorDetails = null
        
        try {
          const errorData = await response.json()
          console.error('❌ API Error Response:', errorData)
          
          errorMessage = errorData.error || 'Generation failed'
          errorDetails = errorData.details
          
          // If it's a Zod validation error, show specific field issues
          if (errorData.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map((detail: any) => 
              `${detail.path?.join('.') || 'field'}: ${detail.message}`
            ).join(', ')
            errorMessage = `Validation error: ${fieldErrors}`
          }
        } catch (parseError) {
          // If we can't parse the error response, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      let savedCount = 0
      let skippedCount = 0
      let failedCount = 0

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const progressUpdate: ProgressUpdate = JSON.parse(line.slice(6))
              
              setProgressUpdates(prev => [...prev, progressUpdate])

              // Update current progress based on the update type
              if (progressUpdate.termIndex && progressUpdate.totalTerms) {
                let status = ''
                switch (progressUpdate.type) {
                  case 'processing':
                    status = `Processing "${progressUpdate.termName}"`
                    break
                  case 'saved':
                    savedCount++
                    status = `✅ Saved "${progressUpdate.termName}"`
                    break
                  case 'skipped':
                    skippedCount++
                    status = `⏭️ Skipped "${progressUpdate.termName}" (duplicate)`
                    break
                  case 'failed':
                    failedCount++
                    status = `❌ Failed "${progressUpdate.termName}": ${progressUpdate.error}`
                    break
                  case 'complete':
                    status = `🎉 Complete! Saved: ${progressUpdate.stats?.saved}, Skipped: ${progressUpdate.stats?.skipped}, Failed: ${progressUpdate.stats?.failed}`
                    break
                }

                setCurrentProgress({
                  current: progressUpdate.termIndex,
                  total: progressUpdate.totalTerms,
                  status
                })
              }

              // Handle completion
              if (progressUpdate.type === 'complete') {
                const stats = progressUpdate.stats
                setResults({
                  success: true,
                  stats,
                  provider: stats?.provider || provider,
                  generation_type: generationType,
                  message: `Generated ${stats?.saved || 0} terms successfully (${stats?.skipped || 0} skipped, ${stats?.failed || 0} failed)`
                })
                
                toast({
                  title: "Generation Complete!",
                  description: `Saved ${stats?.saved || 0} terms, skipped ${stats?.skipped || 0} duplicates, failed ${stats?.failed || 0}`,
                })
              }

            } catch (parseError) {
              console.warn('Failed to parse progress update:', line, parseError)
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Generation error:', error)
      
      // Enhanced user-friendly error messages
      let userMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        if (error.message.includes('Validation error')) {
          userMessage = `Request validation failed: ${error.message}`
        } else if (error.message.includes('HTTP 401')) {
          userMessage = 'Authentication failed. Please refresh and try again.'
        } else if (error.message.includes('HTTP 429')) {
          userMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else if (error.message.includes('HTTP 500')) {
          userMessage = 'Server error occurred. Please try again in a few minutes.'
        } else {
          userMessage = error.message
        }
      }
      
      toast({
        title: "Generation Failed",
        description: userMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    )
  }

  const difficultyLabels = {
    1: 'Basic (Everyone should know)',
    2: 'Intermediate (Engaged citizens)',
    3: 'Standard (Civic education level)',
    4: 'Advanced (Serious learners)',
    5: 'Expert (Civic professionals)'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Generation Settings
            </CardTitle>
            <CardDescription>
              Configure how to generate civic education glossary terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generation Type */}
            <div className="space-y-2">
              <Label>Generation Type</Label>
              <Select value={generationType} onValueChange={(value: any) => setGenerationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate_new">Generate New Terms</SelectItem>
                  <SelectItem value="extract_from_content">Extract from Content</SelectItem>
                  <SelectItem value="optimize_existing">Optimize Existing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Provider */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthropic">Anthropic Claude Sonnet 4</SelectItem>
                  <SelectItem value="openai">OpenAI GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <Label>Number of Terms</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              />
            </div>

            {/* Custom Content */}
            <div className="space-y-2">
              <Label>Custom Content/Focus Area</Label>
              <Textarea
                placeholder="Enter specific topics, areas of focus, or content to analyze..."
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={difficultyLevel.toString()} onValueChange={(value) => setDifficultyLevel(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(difficultyLabels).map(([level, label]) => (
                    <SelectItem key={level} value={level}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Categories & Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Categories & Web Search
            </CardTitle>
            <CardDescription>
              Choose focus categories and enable source verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Focus Categories ({selectedCategories.length} selected)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategories(availableCategories.map(c => c.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                {availableCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Selected: {selectedCategories.join(', ')}
                </div>
              )}
            </div>

            {/* Web Search & Fact-Checking Options */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-web-search"
                  checked={enableWebSearch}
                  onCheckedChange={(checked) => setEnableWebSearch(!!checked)}
                />
                <Label htmlFor="enable-web-search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Enable Web Search & Verification
                </Label>
              </div>

              {enableWebSearch && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Enhanced Content Generation:</strong>
                      <br />
                      • <strong>Anti-Template:</strong> Avoids formulaic "should have been" language patterns
                      <br />
                      • <strong>Source Verification:</strong> Includes specific, verifiable sources with URLs and dates
                      <br />
                      • <strong>Current Examples:</strong> Uses recent (2024-2025) incidents with real names and amounts
                      <br />
                      <strong>Sources are automatically saved to source_metadata table</strong>
                      <br />
                      <br />
                      Prefers: Brave Search (privacy-focused) → Perplexity AI → Google/SerpAPI
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Terms...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate {count} Terms
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Real-time Progress */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Progress
            </CardTitle>
            <CardDescription>
              Generating and saving terms one by one...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentProgress.current} of {currentProgress.total} terms</span>
                <span>{Math.round((currentProgress.current / currentProgress.total) * 100)}%</span>
              </div>
              <Progress value={(currentProgress.current / currentProgress.total) * 100} />
            </div>

            {/* Current Status */}
            <div className="text-sm font-medium text-gray-700">
              {currentProgress.status}
            </div>

            {/* Progress Log */}
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-3 bg-gray-50">
              {progressUpdates.length === 0 && (
                <div className="text-sm text-gray-500 italic">Waiting for progress updates...</div>
              )}
              {progressUpdates.map((update, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-400">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </span>
                  {update.type === 'processing' && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span>Processing "{update.termName}"</span>
                    </>
                  )}
                  {update.type === 'saved' && (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-700">Saved "{update.termName}"</span>
                    </>
                  )}
                  {update.type === 'skipped' && (
                    <>
                      <SkipForward className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-700">Skipped "{update.termName}" (duplicate)</span>
                    </>
                  )}
                  {update.type === 'failed' && (
                    <>
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span className="text-red-700">Failed "{update.termName}": {update.error}</span>
                    </>
                  )}
                  {update.type === 'complete' && (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-green-700 font-medium">
                        Complete! Saved: {update.stats?.saved}, Skipped: {update.stats?.skipped}, Failed: {update.stats?.failed}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generation Complete
            </CardTitle>
            <CardDescription>
              {results.provider} • {results.generation_type} • {results.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.stats.saved}</div>
                  <div className="text-sm text-gray-600">Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{results.stats.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped (Duplicates)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.stats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.stats.generated}</div>
                  <div className="text-sm text-gray-600">Generated</div>
                </div>
              </div>
            )}
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Generation completed successfully! 
                {results.stats && (
                  <>
                    {' '}The new terms have been added to the glossary database. 
                    Refresh the Terms tab to see all saved terms.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 