import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { 
  Flame, 
  Star, 
  TrendingUp, 
  Zap,
  Clock,
  Info
} from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { cn } from '@civicsense/business-logic/utils'
import { topicStatusOperations, type TopicStatus, type TopicStatusType } from '@civicsense/business-logic/services/topics'

interface TopicStatusHistoryProps {
  topicId: string
  className?: string
}

const STATUS_ICONS = {
  breaking: Zap,
  featured: Star,
  trending: TrendingUp,
  viral: Flame
}

const STATUS_COLORS = {
  breaking: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  featured: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  trending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  viral: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
}

export function TopicStatusHistory({ topicId, className }: TopicStatusHistoryProps) {
  const [history, setHistory] = useState<TopicStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const result = await topicStatusOperations.getStatusHistory(topicId)
        setHistory(result.history)
      } catch (err) {
        console.error('Error loading topic status history:', err)
        setError('Failed to load status history')
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [topicId])

  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-3", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-600 dark:text-red-400", className)}>
        {error}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={cn("text-sm text-slate-500 dark:text-slate-400", className)}>
        No status history available
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {history.map((status) => {
        const StatusIcon = STATUS_ICONS[status.status_type as TopicStatusType]
        const colorClass = STATUS_COLORS[status.status_type as TopicStatusType]
        const isActive = !status.ended_at
        
        return (
          <Card 
            key={status.id}
            className={cn(
              "p-4 border-0 shadow-sm",
              isActive ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-900/50"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  colorClass
                )}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white capitalize">
                      {status.status_type}
                    </span>
                    {isActive && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(status.started_at).toLocaleDateString()}
                        {status.ended_at && ` - ${new Date(status.ended_at).toLocaleDateString()}`}
                      </span>
                    </div>
                    
                    {status.reason && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              <span>Reason</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{status.reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
              
              {status.engagement_metrics && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {Object.entries(status.engagement_metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className="capitalize">{key.replace('_', ' ')}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
} 