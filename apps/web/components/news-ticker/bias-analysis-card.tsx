"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react'
import { cn } from '@civicsense/business-logic/utils'
import { 
  ArticleBiasAnalysis, 
  BiasDimension, 
  getBiasColor,
  formatBiasScore,
  getCredibilityLevel
} from '@civicsense/shared/media-bias-engine'

interface BiasAnalysisCardProps {
  analysis: ArticleBiasAnalysis
  dimensions: BiasDimension[]
  onClose?: () => void
  className?: string
}

export function BiasAnalysisCard({ 
  analysis, 
  dimensions,
  onClose, 
  className 
}: BiasAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Get credibility info
  const credibility = getCredibilityLevel(analysis.factual_accuracy_score || undefined)
  
  // Identify top concerns
  const concerns = []
  if (analysis.overall_bias_score && analysis.overall_bias_score > 50) {
    concerns.push({ text: 'High bias detected', severity: 'high' })
  }
  if (analysis.factual_accuracy_score && analysis.factual_accuracy_score < 70) {
    concerns.push({ text: 'Factual accuracy concerns', severity: 'medium' })
  }
  if (analysis.emotional_manipulation_score && analysis.emotional_manipulation_score > 60) {
    concerns.push({ text: 'Emotional manipulation tactics', severity: 'medium' })
  }

  return (
    <Card className={cn(
      "border-2 border-amber-200 dark:border-amber-800 shadow-lg",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Bias Analysis Report</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                What they don't want you to know about this article
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Top Concerns */}
          {concerns.length > 0 && (
            <div className="space-y-2">
              {concerns.map((concern, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    concern.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                  )} />
                  <span className="text-sm font-medium">{concern.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Overall Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Overall Bias</span>
                <span className="text-sm text-muted-foreground">
                  {analysis.overall_bias_score}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={analysis.overall_bias_score || 0} 
                  className={cn(
                    "h-2",
                    analysis.overall_bias_score! > 66 ? "[&>*]:bg-red-500" :
                    analysis.overall_bias_score! > 33 ? "[&>*]:bg-amber-500" : "[&>*]:bg-green-500"
                  )}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Factual Accuracy</span>
                <span className="text-sm text-muted-foreground">
                  {analysis.factual_accuracy_score}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={analysis.factual_accuracy_score || 0} 
                  className={cn(
                    "h-2",
                    analysis.factual_accuracy_score! < 50 ? "[&>*]:bg-red-500" :
                    analysis.factual_accuracy_score! < 80 ? "[&>*]:bg-amber-500" : "[&>*]:bg-green-500"
                  )}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Dimension Scores */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Bias Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(analysis.dimension_scores || {}).map(([dimId, scoreData]: [string, any]) => {
                const dimension = dimensions.find(d => d.id === dimId)
                if (!dimension) return null
                
                return (
                  <div key={dimId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{dimension.dimension_name}</span>
                      <Badge 
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: getBiasColor(dimension, scoreData.score) }}
                      >
                        {formatBiasScore(scoreData.score, dimension)}
                      </Badge>
                    </div>
                    {scoreData.indicators && scoreData.indicators.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        "{scoreData.indicators[0]}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Manipulation Techniques */}
          {analysis.detected_techniques && analysis.detected_techniques.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Manipulation Techniques Detected
                </h4>
                <div className="space-y-2">
                  {analysis.detected_techniques.map((technique: any, idx: number) => (
                    <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant={technique.severity === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {technique.severity}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{technique.technique}</p>
                          {technique.example && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Example: "{technique.example}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* AI Reasoning */}
          {analysis.ai_reasoning && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">The Real Story</h4>
                <p className="text-sm leading-relaxed">{analysis.ai_reasoning}</p>
              </div>
            </>
          )}
          
          {/* Action Items */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              What you can do: Verify claims independently, check multiple sources, and look for what's NOT being said.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
} 