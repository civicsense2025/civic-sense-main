"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import { 
  Clock, 
  AlertTriangle, 
  Info, 
  BookOpen,
  Image as ImageIcon,
  Play,
  FileText
} from "lucide-react"
import { cn } from "@civicsense/shared/lib/utils"
import type { SituationDisplayProps } from "./types"

// =============================================================================
// MEDIA ATTACHMENT COMPONENT
// =============================================================================

interface MediaAttachmentProps {
  attachment: string
  index: number
}

function MediaAttachment({ attachment, index }: MediaAttachmentProps) {
  const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const isVideo = attachment.match(/\.(mp4|webm|ogg)$/i)
  const isDocument = attachment.match(/\.(pdf|doc|docx)$/i)

  return (
    <div className="relative group">
      {isImage && (
        <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img 
            src={attachment} 
            alt={`Situation media ${index + 1}`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-slate-700">
              <ImageIcon className="h-3 w-3 mr-1" />
              Image
            </Badge>
          </div>
        </div>
      )}
      
      {isVideo && (
        <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          <video 
            src={attachment}
            className="w-full h-48 object-cover"
            controls
            preload="metadata"
          />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 text-slate-700">
              <Play className="h-3 w-3 mr-1" />
              Video
            </Badge>
          </div>
        </div>
      )}
      
      {isDocument && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
          <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Document Attachment
          </p>
          <a 
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Open Document
          </a>
        </div>
      )}
      
      {!isImage && !isVideo && !isDocument && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
          <div className="text-slate-400 mb-2">📎</div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Attachment
          </p>
          <a 
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Attachment
          </a>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// CONTEXT INFORMATION COMPONENT
// =============================================================================

interface ContextInfoProps {
  contextInfo: Record<string, any>
}

function ContextInfo({ contextInfo }: ContextInfoProps) {
  const formatValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mt-0.5">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Context Information
          </h4>
          <div className="space-y-2">
            {Object.entries(contextInfo).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-blue-800 dark:text-blue-200 capitalize">
                  {key.replace('_', ' ')}:
                </span>
                <span className="text-blue-700 dark:text-blue-300 ml-2">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// TIME PRESSURE INDICATOR
// =============================================================================

interface TimePressureProps {
  timeLimit: number
  onTimeUp?: () => void
}

function TimePressure({ timeLimit }: TimePressureProps) {
  const [timeLeft, setTimeLeft] = React.useState(timeLimit)

  React.useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getUrgencyColor = () => {
    const percentage = (timeLeft / timeLimit) * 100
    if (percentage > 50) return "text-green-600 dark:text-green-400"
    if (percentage > 25) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getUrgencyBg = () => {
    const percentage = (timeLeft / timeLimit) * 100
    if (percentage > 50) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    if (percentage > 25) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
  }

  if (timeLeft <= 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-900 rounded-full p-1">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-medium text-red-900 dark:text-red-100">
              Time's Up!
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              You must make a decision now.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg p-4", getUrgencyBg())}>
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full p-1", 
          timeLeft > timeLimit * 0.5 ? "bg-green-100 dark:bg-green-900" :
          timeLeft > timeLimit * 0.25 ? "bg-yellow-100 dark:bg-yellow-900" :
          "bg-red-100 dark:bg-red-900"
        )}>
          <Clock className={cn("h-4 w-4", getUrgencyColor())} />
        </div>
        <div>
          <h4 className={cn("font-medium", getUrgencyColor())}>
            Time Pressure
          </h4>
          <p className={cn("text-sm", getUrgencyColor())}>
            {formatTime(timeLeft)} remaining
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN SITUATION DISPLAY COMPONENT
// =============================================================================

export function SituationDisplay({ 
  situation, 
  scenario, 
  gameState,
  className 
}: SituationDisplayProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Situation Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {situation.situation_title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Situation {situation.situation_order}</span>
                {situation.is_branching_point && (
                  <Badge variant="outline" className="text-xs">
                    Branching Point
                  </Badge>
                )}
                {scenario && (
                  <Badge variant="secondary" className="text-xs">
                    {scenario.scenario_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Main Situation Description */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {situation.situation_description}
            </p>
          </div>

          {/* Time Pressure */}
          {situation.time_pressure_seconds && situation.time_pressure_seconds > 0 && (
            <TimePressure timeLimit={situation.time_pressure_seconds} />
          )}

          {/* Required Resources Warning */}
          {situation.required_resources && Object.keys(situation.required_resources).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900 rounded-full p-1 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                    Resource Requirements
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(situation.required_resources).map(([resource, amount]) => {
                      const hasEnough = (gameState.resources[resource] || 0) >= (amount as number)
                      return (
                        <div 
                          key={resource}
                          className={cn(
                            "flex justify-between items-center rounded px-2 py-1 text-sm",
                            hasEnough 
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                          )}
                        >
                          <span className="capitalize">
                            {resource.replace('_', ' ')}
                          </span>
                          <span className="font-medium">
                            {amount} required
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Context Information */}
          {situation.context_information && Object.keys(situation.context_information).length > 0 && (
            <ContextInfo contextInfo={situation.context_information} />
          )}

          {/* Learning Notes */}
          {situation.learning_notes && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-1 mt-0.5">
                  <BookOpen className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Learning Notes
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {situation.learning_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Media Attachments */}
          {situation.media_attachments && situation.media_attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Attachments
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {situation.media_attachments.map((attachment, index) => (
                  <MediaAttachment 
                    key={index}
                    attachment={attachment}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 