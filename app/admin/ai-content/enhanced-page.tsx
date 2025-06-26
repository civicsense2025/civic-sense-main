'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminTracking } from '@/lib/tracking/admin-tracker'
import { useAIMemory } from '@/lib/ai/agent-memory'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle 
} from 'lucide-react'

// Example of how to integrate tracking into AI content generation
export default function EnhancedAIContentPage() {
  const [loading, setLoading] = useState(false)
  const [generationResult, setGenerationResult] = useState<any>(null)
  const [patterns, setPatterns] = useState<any[]>([])
  
  const { trackActivity, trackPerformance, createAlert, trackOperation } = useAdminTracking()
  const { 
    startConversation, 
    addMessage, 
    recordLearning,
    getRelevantPatterns,
    trackGeneratedContent,
    trackPerformance: trackAIPerformance 
  } = useAIMemory()

  // Load relevant patterns on mount
  useEffect(() => {
    loadPatterns()
  }, [])

  const loadPatterns = async () => {
    const contentPatterns = await getRelevantPatterns('content_preference')
    const qualityPatterns = await getRelevantPatterns('quality_standards')
    setPatterns([...contentPatterns, ...qualityPatterns])
  }

  const generateContent = async (topic: string) => {
    setLoading(true)
    const startTime = performance.now()
    
    try {
      // Start AI conversation
      const sessionId = crypto.randomUUID()
      const conversationId = await startConversation({
        sessionId,
        agentType: 'content_generator',
        agentModel: 'gpt-4',
        context: { topic, patterns }
      })

      if (!conversationId) throw new Error('Failed to start conversation')

      // Log user request
      await addMessage({
        conversationId,
        role: 'user',
        content: `Generate quiz content about: ${topic}`,
        metadata: { topic, timestamp: new Date().toISOString() }
      })

      // Track admin activity
      const result = await trackOperation(
        async () => {
          // Simulate AI content generation (replace with actual API call)
          const response = await fetch('/api/admin/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, patterns })
          })
          
          if (!response.ok) throw new Error('Generation failed')
          
          return response.json()
        },
        {
          actionType: 'ai_content_generation',
          actionCategory: 'ai',
          resourceType: 'quiz_content',
          actionDetails: { topic, patternCount: patterns.length }
        }
      )

      // Log AI response
      await addMessage({
        conversationId,
        role: 'assistant',
        content: JSON.stringify(result),
        metadata: { 
          tokensUsed: result.tokensUsed || 0,
          generationTime: performance.now() - startTime 
        },
        tokensUsed: result.tokensUsed
      })

      // Track generated content
      const contentId = await trackGeneratedContent({
        generationType: 'quiz_questions',
        sourceReference: topic,
        parameters: { topic, patterns },
        content: result.content,
        qualityScores: result.qualityScores,
        modelUsed: 'gpt-4'
      })

      // Record what we learned from this generation
      if (result.success) {
        await recordLearning({
          patternType: 'content_preference',
          patternCategory: 'quality',
          description: `High-quality content generated for topic: ${topic}`,
          confidence: 0.8,
          evidence: [{ topic, scores: result.qualityScores }],
          source: 'content_generator'
        })
      }

      // Track AI performance
      await trackAIPerformance('content_generator', {
        success: result.success,
        responseTimeMs: Math.round(performance.now() - startTime),
        tokensUsed: result.tokensUsed,
        fallbackUsed: false
      })

      // Track UI performance metric
      trackPerformance({
        metricType: 'ai_generation',
        metricName: 'quiz_content_generation',
        value: performance.now() - startTime,
        unit: 'ms',
        metadata: { topic, success: result.success }
      })

      setGenerationResult(result)

      // Create alert if quality is low
      if (result.qualityScores?.overall < 0.7) {
        await createAlert({
          alertType: 'warning',
          alertCategory: 'ai',
          title: 'Low Quality Content Generated',
          message: `Generated content for "${topic}" scored below quality threshold`,
          details: { 
            topic, 
            scores: result.qualityScores,
            contentId 
          },
          severity: 3
        })
      }

    } catch (error) {
      console.error('Generation error:', error)
      
      // Create error alert
      await createAlert({
        alertType: 'error',
        alertCategory: 'ai',
        title: 'AI Content Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { topic, timestamp: new Date().toISOString() },
        severity: 4
      })

      setGenerationResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Generation failed' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          AI Content Generation (Enhanced)
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Now with comprehensive tracking and learning capabilities
        </p>
      </div>

      {/* Pattern Display */}
      {patterns.length > 0 && (
        <Card className="p-6 bg-white/80 border-gray-100">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium">Learned Patterns Applied</h3>
            </div>
            <div className="space-y-2">
              {patterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span className="text-gray-600">{pattern.description}</span>
                  <span className="text-xs text-gray-400">
                    ({Math.round(pattern.confidence * 100)}% confidence)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Generation Interface */}
      <Card className="p-6 bg-white/80 border-gray-100">
        <div className="space-y-4">
          <Button
            onClick={() => generateContent('Constitutional Rights')}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Content'}
          </Button>

          {generationResult && (
            <div className="mt-4 p-4 rounded-lg border">
              {generationResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Generation Successful</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold">
                        {generationResult.qualityScores?.overall || 0}%
                      </div>
                      <div className="text-sm text-gray-500">Quality Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold">
                        {generationResult.tokensUsed || 0}
                      </div>
                      <div className="text-sm text-gray-500">Tokens Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold">
                        {generationResult.content?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Items Generated</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>{generationResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tracking Visualization */}
      <Card className="p-6 bg-white/80 border-gray-100">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Activity Tracking</h3>
          </div>
          <div className="text-sm text-gray-600">
            All actions are being tracked for performance monitoring and AI learning.
            The system is continuously improving based on usage patterns.
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">Admin Panel Schema</div>
              <div className="text-xs text-gray-500 mt-1">
                Tracking user actions, performance metrics, and system health
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">AI Agent Schema</div>
              <div className="text-xs text-gray-500 mt-1">
                Learning patterns, caching analyses, and building knowledge graph
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Alert */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-medium text-blue-900">How the AI Agent Learns</div>
            <div className="text-sm text-blue-700">
              The AI agent stores successful patterns, analyzes content quality, and builds 
              relationships between different content types. Even when external AI APIs are 
              unavailable, the system can use cached analyses and learned patterns to provide 
              intelligent fallback responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 