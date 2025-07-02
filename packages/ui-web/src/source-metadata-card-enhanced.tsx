"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { Separator } from "../ui/separator"
import { 
  Shield, 
  AlertTriangle, 
  Info,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Building,
  User
} from "lucide-react"
import { cn } from "../../utils"
import { FeedbackButton } from "@/components/feedback/feedback-button"
import { useAuth } from "@/components/auth/auth-provider"
import { useGuestAccess } from "@civicsense/shared/hooks/useGuestAccess"
import {
  getMediaOrganizationByDomain,
  getBiasDimensions,
  getArticleBiasAnalysis,
  formatBiasScore,
  getBiasColor,
  getCredibilityLevel,
  hasSignificantBias,
  getOrganizationTypeLabel,
  submitBiasFeedback,
  type MediaOrganizationWithScores,
  type BiasDimension,
  type ArticleBiasAnalysis,
  BIAS_DIMENSIONS
} from "@civicsense/shared/lib/media-bias-engine"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Slider } from "../ui/slider"
import { Textarea } from "../ui/textarea"
import { useToast } from "@civicsense/shared/hooks/use-toast"

interface SourceMetadata {
  title: string
  description: string
  domain: string
  url: string
  image?: string | null
  siteName?: string | null
  type?: string | null
  favicon?: string | null
  author?: string | null
  publishedTime?: string | null
  modifiedTime?: string | null
}

interface Source {
  name: string
  url: string
}

interface SourceMetadataCardEnhancedProps {
  source: Source
  className?: string
  showThumbnail?: boolean
  compact?: boolean
  showBiasInfo?: boolean
  enableFeedback?: boolean
}

// Simple cache
const metadataCache = new Map<string, { data: SourceMetadata; timestamp: number }>()
const biasCache = new Map<string, { org: MediaOrganizationWithScores; timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// Helper function to format dates
function formatDate(dateString: string | null): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return null
  }
}

// Bias Score Display Component
function BiasScoreDisplay({ 
  score, 
  dimension,
  onClick,
  compact = false
}: { 
  score: number
  dimension: BiasDimension
  onClick?: () => void
  compact?: boolean
}) {
  const label = formatBiasScore(score, dimension)
  const color = getBiasColor(dimension, score)
  const isSignificant = hasSignificantBias(score, dimension)
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isSignificant ? "default" : "secondary"}
              className="cursor-pointer h-6 px-2"
              style={{ backgroundColor: isSignificant ? color : undefined }}
              onClick={onClick}
            >
              {dimension.dimension_name.split(' ')[0]}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dimension.dimension_name}: {label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{dimension.dimension_name}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <Progress 
        value={Math.abs(score)} 
        max={100} 
        className="h-2"
        style={{ 
          '--progress-background': color 
        } as React.CSSProperties}
      />
    </div>
  )
}

// Bias Feedback Dialog
function BiasFeedbackDialog({
  organization,
  dimension,
  currentScore,
  onSubmit
}: {
  organization: MediaOrganizationWithScores
  dimension: BiasDimension
  currentScore: number
  onSubmit: (score: number, feedback: string) => void
}) {
  const [suggestedScore, setSuggestedScore] = useState(currentScore)
  const [feedbackText, setFeedbackText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit(suggestedScore, feedbackText)
    setIsSubmitting(false)
    toast({
      title: "Feedback submitted",
      description: "Thank you for helping improve our bias detection!"
    })
  }
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Provide Bias Feedback</DialogTitle>
        <DialogDescription>
          Help us improve our assessment of {organization.name}'s {dimension.dimension_name}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Score: {formatBiasScore(currentScore, dimension)}</label>
          <label className="text-sm font-medium">Your Assessment: {formatBiasScore(suggestedScore, dimension)}</label>
          <Slider
            value={[suggestedScore]}
            onValueChange={(value) => setSuggestedScore(value[0])}
            min={dimension.scale_type === 'spectrum' ? -100 : 0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Comments (optional)</label>
          <Textarea
            placeholder="Provide evidence or reasoning for your assessment..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={3}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || suggestedScore === currentScore}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </DialogContent>
  )
}

export function SourceMetadataCardEnhanced({ 
  source, 
  className = "", 
  showThumbnail = true, 
  compact = false,
  showBiasInfo = true,
  enableFeedback = true
}: SourceMetadataCardEnhancedProps) {
  const [metadata, setMetadata] = useState<SourceMetadata | null>(null)
  const [mediaOrg, setMediaOrg] = useState<MediaOrganizationWithScores | null>(null)
  const [articleAnalysis, setArticleAnalysis] = useState<ArticleBiasAnalysis | null>(null)
  const [dimensions, setDimensions] = useState<BiasDimension[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [isLoadingBias, setIsLoadingBias] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useAuth()
  const { guestToken } = useGuestAccess()
  const { toast } = useToast()

  // Load metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      // Check cache first
      const cached = metadataCache.get(source.url)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setMetadata(cached.data)
        return
      }

      setIsLoadingMetadata(true)
      setError(null)

      try {
        const response = await fetch('/api/fetch-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: source.url }),
        })

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const data = await response.json()
        const fetchedMetadata: SourceMetadata = {
          title: data.title || source.name,
          description: data.description || '',
          domain: data.domain || new URL(source.url).hostname,
          url: data.url || source.url,
          image: data.image,
          siteName: data.siteName,
          type: data.type,
          favicon: data.favicon,
          author: data.author,
          publishedTime: data.publishedTime,
          modifiedTime: data.modifiedTime
        }

        metadataCache.set(source.url, { data: fetchedMetadata, timestamp: Date.now() })
        setMetadata(fetchedMetadata)
      } catch (err) {
        console.error('Error fetching metadata:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata')
        
        // Set fallback metadata
        const fallbackMetadata: SourceMetadata = {
          title: source.name || 'External Link',
          description: 'Click to visit this source',
          domain: new URL(source.url).hostname,
          url: source.url
        }
        setMetadata(fallbackMetadata)
      } finally {
        setIsLoadingMetadata(false)
      }
    }

    fetchMetadata()
  }, [source.url, source.name])

  // Load bias information
  useEffect(() => {
    if (!metadata || !showBiasInfo) return

    const fetchBiasInfo = async () => {
      // Check cache first
      const cached = biasCache.get(metadata.domain)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setMediaOrg(cached.org)
        return
      }

      setIsLoadingBias(true)

      try {
        // Get dimensions
        const dims = await getBiasDimensions()
        setDimensions(dims)

        // Get organization info
        const org = await getMediaOrganizationByDomain(metadata.domain)
        if (org) {
          biasCache.set(metadata.domain, { org, timestamp: Date.now() })
          setMediaOrg(org)
        }

        // Get article analysis if available
        const analysis = await getArticleBiasAnalysis(source.url)
        if (analysis) {
          setArticleAnalysis(analysis)
        }
      } catch (err) {
        console.error('Error fetching bias info:', err)
      } finally {
        setIsLoadingBias(false)
      }
    }

    fetchBiasInfo()
  }, [metadata, source.url, showBiasInfo])

  const handleBiasFeedback = async (dimensionId: string, score: number, feedbackText: string) => {
    if (!mediaOrg) return

    const success = await submitBiasFeedback(
      {
        feedback_type: 'dimension_score',
        organization_id: mediaOrg.id,
        dimension_id: dimensionId,
        suggested_score: score,
        feedback_text: feedbackText
      },
      user?.id,
      guestToken || undefined
    )

    if (success) {
      toast({
        title: "Thank you!",
        description: "Your feedback helps improve our bias detection."
      })
    }
  }

  // Compact view
  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline text-left",
          className
        )}
      >
        {mediaOrg && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: getCredibilityLevel(mediaOrg.credibility?.transparency_report_url ? 80 : 60).color 
                  }}
                >
                  {mediaOrg.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getOrganizationTypeLabel(mediaOrg.organization_type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <span>{metadata?.title || source.name}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    )
  }

  // Loading state
  if (isLoadingMetadata) {
    return (
      <div className={cn(
        "flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse",
        className
      )}>
        <div className="flex-1 text-left">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !metadata) {
    return (
      <div className={cn(
        "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
        className
      )}>
        <p className="text-sm text-red-600 dark:text-red-400 text-left">Failed to load metadata: {error}</p>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm text-left">
          {source.url}
        </a>
      </div>
    )
  }

  const credibility = mediaOrg ? getCredibilityLevel(mediaOrg.transparency_score || undefined) : null

  // Full card view
  return (
    <Card className={cn("overflow-hidden", className)}>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          {showThumbnail && metadata && (
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              {metadata.image && !imageError ? (
                <img
                  src={metadata.image}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : metadata.favicon && !imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={metadata.favicon}
                    alt=""
                    className="w-8 h-8"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <Globe className="w-6 h-6" />
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 text-left">
            {/* Header with org info */}
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-left">
                  {metadata?.title || source.name}
                </h4>
              </div>
              {mediaOrg && (
                <div className="flex items-center gap-2 ml-2">
                  {credibility && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              credibility.color === 'green' && "border-green-500 text-green-700 dark:text-green-400",
                              credibility.color === 'blue' && "border-blue-500 text-blue-700 dark:text-blue-400",
                              credibility.color === 'yellow' && "border-yellow-500 text-yellow-700 dark:text-yellow-400",
                              credibility.color === 'orange' && "border-orange-500 text-orange-700 dark:text-orange-400",
                              credibility.color === 'red' && "border-red-500 text-red-700 dark:text-red-400"
                            )}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {credibility.level}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{credibility.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>
            
            {/* Description */}
            {metadata?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 text-left">
                {metadata.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {mediaOrg && (
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  <span>{getOrganizationTypeLabel(mediaOrg.organization_type)}</span>
                </div>
              )}
              {metadata?.author && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{metadata.author}</span>
                </div>
              )}
              {metadata?.publishedTime && (
                <span>{formatDate(metadata.publishedTime)}</span>
              )}
            </div>

            {/* Bias indicators (compact) */}
            {showBiasInfo && mediaOrg && mediaOrg.bias_scores && mediaOrg.bias_scores.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Bias:</span>
                <div className="flex gap-1 flex-wrap">
                  {mediaOrg.bias_scores
                    .filter(score => score.dimension && hasSignificantBias(score.current_score, score.dimension))
                    .slice(0, 3)
                    .map(score => score.dimension && (
                      <BiasScoreDisplay
                        key={score.dimension_id}
                        score={score.current_score}
                        dimension={score.dimension}
                        compact
                      />
                    ))}
                  {mediaOrg.bias_scores.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{mediaOrg.bias_scores.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* External link icon */}
          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        </div>
      </a>

      {/* Expandable bias details */}
      {showBiasInfo && mediaOrg && mediaOrg.bias_scores && mediaOrg.bias_scores.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full justify-between"
            >
              <span className="text-sm">View detailed bias analysis</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {isExpanded && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {isLoadingBias ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Organization info */}
                      <div className="space-y-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          About {mediaOrg.name}
                        </h5>
                        {mediaOrg.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {mediaOrg.description}
                          </p>
                        )}
                        {mediaOrg.transparency_score && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Transparency Score:</span>
                            <Progress value={mediaOrg.transparency_score} className="h-2 w-24" />
                            <span className="text-sm font-medium">{mediaOrg.transparency_score}%</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Detailed bias scores */}
                      <div className="space-y-3">
                        <h5 className="font-medium">Bias Assessment</h5>
                        {mediaOrg.bias_scores.map(score => score.dimension && (
                          <div key={score.dimension_id} className="space-y-2">
                            <BiasScoreDisplay
                              score={score.current_score}
                              dimension={score.dimension}
                            />
                            {enableFeedback && (
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs"
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Provide Feedback
                                    </Button>
                                  </DialogTrigger>
                                  <BiasFeedbackDialog
                                    organization={mediaOrg}
                                    dimension={score.dimension}
                                    currentScore={score.current_score}
                                    onSubmit={(newScore, feedback) => 
                                      handleBiasFeedback(score.dimension_id, newScore, feedback)
                                    }
                                  />
                                </Dialog>
                                <span className="text-xs text-gray-500">
                                  Confidence: {(score.confidence_level * 100).toFixed(0)}% • 
                                  {score.sample_size} samples
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* General feedback button */}
                      {enableFeedback && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Help improve our analysis</span>
                            <FeedbackButton
                              contextType="content"
                              contextId={source.url}
                              variant="outline"
                              size="sm"
                              label="Report Issue"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </>
      )}
    </Card>
  )
} 